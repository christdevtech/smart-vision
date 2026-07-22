import type { CollectionAfterChangeHook } from 'payload'
import {
  determineSubscriptionPlan,
  findOrCreateUserSubscription,
  getSubscriptionCosts,
} from '@/utilities/subscription'

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }
  return null
}

export const applyPaymentSettlement: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const transactionId = relationshipId(doc.transaction)
  const userId = relationshipId(doc.user)

  if (!transactionId || !userId) {
    throw new Error('Settlement is missing its transaction or user')
  }

  const transaction = await req.payload.findByID({
    collection: 'transactions',
    id: transactionId,
    depth: 0,
    req,
  })

  const transactionUserId = relationshipId(transaction.user)
  if (
    transactionUserId !== userId ||
    transaction.amount !== doc.amount ||
    transaction.fapshiTransId !== doc.providerTransactionId ||
    transaction.externalId !== doc.externalId
  ) {
    throw new Error('Settlement no longer matches its transaction')
  }

  let plan = transaction.plan
  if (plan !== 'monthly' && plan !== 'annual') {
    const costs = await getSubscriptionCosts(req.payload)
    plan = determineSubscriptionPlan(transaction.amount, costs) ?? undefined
  }

  if (plan !== 'monthly' && plan !== 'annual') {
    throw new Error('Cannot determine the paid subscription plan')
  }

  if (doc.plan !== plan) {
    throw new Error('Settlement plan no longer matches its transaction')
  }

  const subscription = await findOrCreateUserSubscription(
    req.payload,
    userId,
    plan,
    transaction.amount,
    transaction.id,
    req,
  )

  const checkedByStatusRoute = doc.source === 'manual' || doc.source === 'batch'

  await req.payload.update({
    collection: 'transactions',
    id: transaction.id,
    req,
    data: {
      status: 'successful',
      subscription: subscription.id,
      settlement: doc.id,
      settledAt: doc.verifiedAt,
      providerVerifiedAt: doc.verifiedAt,
      dateConfirmed: doc.providerConfirmedAt,
      revenue: doc.revenue,
      ...(doc.paymentMedium ? { paymentMedium: doc.paymentMedium } : {}),
      ...(doc.financialTransId ? { financialTransId: doc.financialTransId } : {}),
      ...(doc.source === 'webhook'
        ? { webhookReceived: true, webhookReceivedAt: doc.verifiedAt }
        : {}),
      ...(checkedByStatusRoute
        ? {
            lastStatusCheck: doc.verifiedAt,
            statusCheckCount: (transaction.statusCheckCount || 0) + 1,
          }
        : {}),
    },
  })

  return doc
}
