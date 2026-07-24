import type { Transaction } from '@/payload-types'
import type { FapshiTransaction, InternalPaymentStatus } from '@/utilities/fapshi'
import { mapFapshiStatus } from '@/utilities/fapshi'
import { determineSubscriptionPlan, getSubscriptionCosts } from '@/utilities/subscription'
import {
  calculatePaymentAccounting,
  getPaymentAccountingSettings,
} from '@/utilities/paymentAccounting'
import type { Payload } from 'payload'

export type PaymentSettlementSource = 'webhook' | 'manual' | 'batch' | 'reconciliation'

export interface PaymentStatusResult {
  status: InternalPaymentStatus
  updated: boolean
  settled: boolean
  alreadySettled: boolean
}

type TransactionWithSettlement = Transaction & {
  plan?: 'monthly' | 'annual' | null
  settledAt?: string | null
}

const relationshipId = (value: Transaction['user']): string =>
  typeof value === 'string' ? value : value.id

export function assertProviderTransactionMatches(
  transaction: TransactionWithSettlement,
  providerTransaction: FapshiTransaction,
): void {
  const mismatches: string[] = []

  if (!transaction.fapshiTransId || providerTransaction.transId !== transaction.fapshiTransId) {
    mismatches.push('provider transaction ID')
  }

  if (!transaction.externalId || providerTransaction.externalId !== transaction.externalId) {
    mismatches.push('external ID')
  }

  if (providerTransaction.userId !== relationshipId(transaction.user)) {
    mismatches.push('user ID')
  }

  if (providerTransaction.amount !== transaction.amount) {
    mismatches.push('amount')
  }

  if (mismatches.length > 0) {
    throw new Error(`Provider transaction mismatch: ${mismatches.join(', ')}`)
  }
}

export function isDuplicateSettlementError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? error.code : undefined
  const message = 'message' in error ? String(error.message) : ''

  return code === 11000 || /duplicate key|unique constraint/i.test(message)
}

const isTerminalLocalStatus = (transaction: TransactionWithSettlement): boolean =>
  transaction.status === 'successful' || Boolean(transaction.settledAt)

const shouldApplyNonSuccessfulStatus = (
  currentStatus: Transaction['status'],
  nextStatus: InternalPaymentStatus,
): boolean => {
  if (currentStatus === nextStatus) return false
  if (currentStatus === 'failed' || currentStatus === 'expired' || currentStatus === 'refunded') {
    return false
  }
  return nextStatus !== 'created'
}

export async function processVerifiedPaymentStatus(
  payload: Payload,
  transaction: TransactionWithSettlement,
  providerTransaction: FapshiTransaction,
  source: PaymentSettlementSource,
  verifiedAt = new Date().toISOString(),
): Promise<PaymentStatusResult> {
  assertProviderTransactionMatches(transaction, providerTransaction)

  const status = mapFapshiStatus(providerTransaction.status)

  // Successful legacy transactions predate the settlement ledger. Treat them as
  // already applied so a late callback cannot extend the subscription again.
  if (isTerminalLocalStatus(transaction)) {
    const checkedByStatusRoute = source === 'manual' || source === 'batch'
    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: {
        providerVerifiedAt: verifiedAt,
        ...(source === 'webhook' ? { webhookReceived: true, webhookReceivedAt: verifiedAt } : {}),
        ...(checkedByStatusRoute
          ? {
              lastStatusCheck: verifiedAt,
              statusCheckCount: (transaction.statusCheckCount || 0) + 1,
            }
          : {}),
      },
    })

    return { status: 'successful', updated: false, settled: true, alreadySettled: true }
  }

  if (status === 'successful') {
    let plan = transaction.plan
    if (plan !== 'monthly' && plan !== 'annual') {
      plan = determineSubscriptionPlan(transaction.amount, await getSubscriptionCosts(payload))
    }

    if (plan !== 'monthly' && plan !== 'annual') {
      throw new Error('Cannot determine the paid subscription plan')
    }

    const accountingSettings = await getPaymentAccountingSettings(payload)
    const accounting = calculatePaymentAccounting({
      amount: providerTransaction.amount,
      providerFeePercentage: accountingSettings.providerFeePercentage,
      providerRevenue: providerTransaction.revenue,
      referralRewardPercentage: accountingSettings.referralRewardPercentage,
    })

    try {
      await payload.create({
        collection: 'payment-settlements',
        data: {
          transaction: transaction.id,
          providerTransactionId: providerTransaction.transId,
          externalId: providerTransaction.externalId,
          user: relationshipId(transaction.user),
          amount: providerTransaction.amount,
          plan,
          revenue: accounting.revenue,
          providerFeeAmount: accounting.providerFeeAmount,
          providerFeeRateBasisPoints: accounting.providerFeeRateBasisPoints,
          ...(providerTransaction.medium === 'mobile money' ||
          providerTransaction.medium === 'orange money'
            ? { paymentMedium: providerTransaction.medium }
            : {}),
          ...(providerTransaction.financialTransId
            ? { financialTransId: providerTransaction.financialTransId }
            : {}),
          providerConfirmedAt: providerTransaction.dateConfirmed || verifiedAt,
          verifiedAt,
          source,
        },
      })

      return { status, updated: true, settled: true, alreadySettled: false }
    } catch (error) {
      if (!isDuplicateSettlementError(error)) throw error

      const existingSettlement = await payload.find({
        collection: 'payment-settlements',
        where: { transaction: { equals: transaction.id } },
        limit: 1,
        depth: 0,
      })

      if (existingSettlement.docs.length === 0) throw error

      return { status, updated: false, settled: true, alreadySettled: true }
    }
  }

  const updateStatus = shouldApplyNonSuccessfulStatus(transaction.status, status)
  const checkedByStatusRoute = source === 'manual' || source === 'batch'
  const updateData: Record<string, unknown> = {
    providerVerifiedAt: verifiedAt,
    ...(updateStatus ? { status } : {}),
    ...(source === 'webhook' ? { webhookReceived: true, webhookReceivedAt: verifiedAt } : {}),
    ...(checkedByStatusRoute
      ? {
          lastStatusCheck: verifiedAt,
          statusCheckCount: (transaction.statusCheckCount || 0) + 1,
        }
      : {}),
  }

  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: updateData,
  })

  return {
    status,
    updated: updateStatus,
    settled: false,
    alreadySettled: false,
  }
}
