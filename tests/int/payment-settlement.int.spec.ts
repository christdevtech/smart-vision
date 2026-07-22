import { PaymentSettlements } from '@/collections/PaymentSettlements'
import { applyPaymentSettlement } from '@/collections/PaymentSettlements/hooks/applyPaymentSettlement'
import { Transactions } from '@/collections/Transactions'
import {
  assertProviderTransactionMatches,
  processVerifiedPaymentStatus,
} from '@/services/paymentSettlement'
import { updateSubscriptionAfterPayment } from '@/utilities/subscription'
import { describe, expect, it, vi } from 'vitest'

const transaction = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'transaction-1',
    user: 'user-1',
    transactionId: 'sv_external-1',
    fapshiTransId: 'fapshi-1',
    externalId: 'sv_external-1',
    amount: 3000,
    plan: 'monthly',
    status: 'pending',
    dateInitiated: '2026-07-22T10:00:00.000Z',
    statusCheckCount: 0,
    createdAt: '2026-07-22T10:00:00.000Z',
    updatedAt: '2026-07-22T10:00:00.000Z',
    ...overrides,
  }) as any

const providerTransaction = (overrides: Record<string, unknown> = {}) =>
  ({
    transId: 'fapshi-1',
    status: 'SUCCESSFUL',
    medium: 'mobile money',
    serviceName: 'Smart Vision',
    amount: 3000,
    revenue: 2900,
    payerName: 'Student User',
    email: 'student@example.com',
    redirectUrl: '',
    externalId: 'sv_external-1',
    userId: 'user-1',
    webhook: 'https://smartvisioncm.com/api/custom/payments/webhook/fapshi',
    financialTransId: 'operator-1',
    dateInitiated: '2026-07-22T10:00:00.000Z',
    dateConfirmed: '2026-07-22T10:01:00.000Z',
    ...overrides,
  }) as any

const getField = (name: string): any => {
  const field = PaymentSettlements.fields.find((candidate: any) => candidate.name === name)
  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

const getTransactionField = (name: string): any => {
  const field = Transactions.fields.find((candidate: any) => candidate.name === name)
  if (!field) throw new Error(`Missing transaction field: ${name}`)
  return field
}

describe('provider-verified payment settlement', () => {
  it.each([
    ['provider transaction ID', { transId: 'forged' }],
    ['external ID', { externalId: 'forged' }],
    ['user ID', { userId: 'victim' }],
    ['amount', { amount: 100 }],
  ])('rejects a mismatched %s', (expected, providerOverrides) => {
    expect(() =>
      assertProviderTransactionMatches(transaction(), providerTransaction(providerOverrides)),
    ).toThrow(expected)
  })

  it('creates one immutable settlement from an authenticated successful status', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 'settlement-1' }),
      find: vi.fn(),
      update: vi.fn(),
    }

    const result = await processVerifiedPaymentStatus(
      payload as any,
      transaction(),
      providerTransaction(),
      'webhook',
      '2026-07-22T10:02:00.000Z',
    )

    expect(result).toEqual({
      status: 'successful',
      updated: true,
      settled: true,
      alreadySettled: false,
    })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'payment-settlements',
        data: expect.objectContaining({
          transaction: 'transaction-1',
          providerTransactionId: 'fapshi-1',
          externalId: 'sv_external-1',
          user: 'user-1',
          amount: 3000,
          plan: 'monthly',
        }),
      }),
    )
  })

  it('turns a concurrent unique-key loss into an idempotent success', async () => {
    const duplicateError = Object.assign(new Error('duplicate key'), { code: 11000 })
    const payload = {
      create: vi.fn().mockRejectedValue(duplicateError),
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'settlement-1' }] }),
      update: vi.fn(),
    }

    await expect(
      processVerifiedPaymentStatus(payload as any, transaction(), providerTransaction(), 'manual'),
    ).resolves.toMatchObject({ settled: true, alreadySettled: true, updated: false })
  })

  it('never creates a second ledger entry for a locally settled transaction', async () => {
    const payload = { create: vi.fn(), update: vi.fn().mockResolvedValue({}) }

    const result = await processVerifiedPaymentStatus(
      payload as any,
      transaction({ status: 'successful', settledAt: '2026-07-22T10:02:00.000Z' }),
      providerTransaction(),
      'manual',
    )

    expect(result.alreadySettled).toBe(true)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastStatusCheck: expect.any(String) }),
      }),
    )
  })

  it('does not regress a final failed status back to pending', async () => {
    const payload = { update: vi.fn().mockResolvedValue({}) }

    const result = await processVerifiedPaymentStatus(
      payload as any,
      transaction({ status: 'failed' }),
      providerTransaction({ status: 'PENDING' }),
      'batch',
    )

    expect(result.updated).toBe(false)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ status: 'pending' }) }),
    )
  })
})

describe('settlement ledger transaction behavior', () => {
  it('enforces unique transaction, provider, and external identifiers', () => {
    for (const fieldName of ['transaction', 'providerTransactionId', 'externalId']) {
      expect(getField(fieldName)).toMatchObject({ unique: true, index: true, required: true })
    }

    for (const fieldName of ['transactionId', 'fapshiTransId', 'externalId']) {
      expect(getTransactionField(fieldName)).toMatchObject({ unique: true, index: true })
    }
  })

  it('cannot be mutated through collection access', async () => {
    const args = { req: { user: { id: 'admin-1', role: 'admin' } } } as any

    expect(await PaymentSettlements.access?.create?.(args)).toBe(false)
    expect(await PaymentSettlements.access?.update?.(args)).toBe(false)
    expect(await PaymentSettlements.access?.delete?.(args)).toBe(false)
  })

  it('threads the Payload request through subscription and transaction writes', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue(transaction()),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      create: vi.fn().mockResolvedValue({ id: 'subscription-1' }),
      update: vi.fn().mockResolvedValue({}),
    }
    const req = { payload } as any

    await applyPaymentSettlement({
      doc: {
        id: 'settlement-1',
        transaction: 'transaction-1',
        providerTransactionId: 'fapshi-1',
        externalId: 'sv_external-1',
        user: 'user-1',
        amount: 3000,
        plan: 'monthly',
        revenue: 2900,
        paymentMedium: 'mobile money',
        financialTransId: 'operator-1',
        providerConfirmedAt: '2026-07-22T10:01:00.000Z',
        verifiedAt: '2026-07-22T10:02:00.000Z',
        source: 'webhook',
      },
      operation: 'create',
      req,
    } as any)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'subscriptions',
        req,
        data: expect.objectContaining({ paymentStatus: 'paid' }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'transactions',
        req,
        data: expect.objectContaining({
          status: 'successful',
          settlement: 'settlement-1',
          subscription: 'subscription-1',
        }),
      }),
    )
  })

  it('does not extend a subscription when the transaction was already applied', async () => {
    const currentSubscription = {
      id: 'subscription-1',
      user: 'user-1',
      plan: 'monthly',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-08-01T00:00:00.000Z',
      paymentStatus: 'paid',
      transactions: ['transaction-1'],
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }
    const payload = {
      findByID: vi.fn().mockResolvedValue(currentSubscription),
      update: vi.fn(),
    }

    const result = await updateSubscriptionAfterPayment(payload as any, {
      subscriptionId: 'subscription-1',
      plan: 'monthly',
      amount: 3000,
      transactionId: 'transaction-1',
    })

    expect(result).toBe(currentSubscription)
    expect(payload.update).not.toHaveBeenCalled()
  })
})
