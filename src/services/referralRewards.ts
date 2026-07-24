import type {
  PaymentSettlement,
  ReferralAttribution,
  ReferralReward,
  Subscription,
  Transaction,
  User,
} from '@/payload-types'
import type { PayloadRequest } from 'payload'
import {
  calculatePaymentAccounting,
  getPaymentAccountingSettings,
} from '@/utilities/paymentAccounting'

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }
  return null
}

const isDuplicateRewardError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? error.code : undefined
  const message = 'message' in error ? String(error.message) : ''
  return code === 11000 || /duplicate key|unique constraint/i.test(message)
}

export async function createReferralRewardForSettlement({
  paymentSettlement,
  referredSubscription: _referredSubscription,
  req,
  transaction,
}: {
  paymentSettlement: PaymentSettlement
  referredSubscription: Subscription
  req: PayloadRequest
  transaction: Transaction
}): Promise<ReferralReward | null> {
  const referredUserId = relationshipId(paymentSettlement.user)
  if (!referredUserId) return null

  const referredUser = (await req.payload.findByID({
    collection: 'users',
    id: referredUserId,
    depth: 0,
    req,
  })) as User
  const referrerId = relationshipId(referredUser.referredBy)
  if (!referrerId) return null

  const [accountingSettings, attributionResult, referrer] = await Promise.all([
    getPaymentAccountingSettings(req.payload, req),
    req.payload.find({
      collection: 'referral-attributions',
      where: { referredUser: { equals: referredUserId } },
      depth: 0,
      limit: 1,
      req,
    }),
    req.payload.findByID({
      collection: 'users',
      id: referrerId,
      depth: 0,
      req,
    }) as Promise<User>,
  ])

  const subscriptionResult = await req.payload.find({
    collection: 'subscriptions',
    where: {
      and: [
        { user: { equals: referrerId } },
        { paymentStatus: { equals: 'paid' } },
        { plan: { in: ['monthly', 'annual'] } },
        { startDate: { less_than_equal: paymentSettlement.verifiedAt } },
        { endDate: { greater_than: paymentSettlement.verifiedAt } },
      ],
    },
    depth: 0,
    limit: 1,
    sort: '-endDate',
    req,
  })
  const referrerSubscription = subscriptionResult.docs[0] as Subscription | undefined

  let ineligibilityReason:
    | 'program-disabled'
    | 'referrer-inactive'
    | 'referrer-subscription-inactive'
    | 'self-referral'
    | undefined

  if (!accountingSettings.referralProgramEnabled) ineligibilityReason = 'program-disabled'
  else if (referrerId === referredUserId) ineligibilityReason = 'self-referral'
  else if (referrer.isActive === false) ineligibilityReason = 'referrer-inactive'
  else if (!referrerSubscription) ineligibilityReason = 'referrer-subscription-inactive'

  const accounting = calculatePaymentAccounting({
    amount: paymentSettlement.amount,
    providerFeePercentage: accountingSettings.providerFeePercentage,
    providerRevenue: paymentSettlement.revenue,
    referralRewardPercentage: accountingSettings.referralRewardPercentage,
  })
  const eligible = !ineligibilityReason
  const rewardAmount = eligible ? accounting.referralRewardAmount : 0
  const rewardData = {
    attribution: (attributionResult.docs[0] as ReferralAttribution | undefined)?.id,
    grossPaymentAmount: accounting.grossAmount,
    idempotencyKey: `referral-reward:${paymentSettlement.id}`,
    ...(ineligibilityReason ? { ineligibilityReason } : {}),
    paymentSettlement: paymentSettlement.id,
    plan: paymentSettlement.plan,
    platformRevenueAfterReward: accounting.revenue - rewardAmount,
    providerFeeAmount: accounting.providerFeeAmount,
    providerFeeRateBasisPoints: accounting.providerFeeRateBasisPoints,
    referredUser: referredUserId,
    referrer: referrerId,
    ...(referrerSubscription ? { referrerSubscription: referrerSubscription.id } : {}),
    revenue: accounting.revenue,
    rewardAmount,
    rewardRateBasisPoints: accounting.referralRewardRateBasisPoints,
    settledAt: paymentSettlement.verifiedAt,
    status: eligible ? ('available' as const) : ('ineligible' as const),
    transaction: transaction.id,
  }

  try {
    const reward = (await req.payload.create({
      collection: 'referral-rewards',
      data: rewardData,
      req,
    })) as ReferralReward

    if (ineligibilityReason === 'referrer-subscription-inactive') {
      const missedRewardAmount = accounting.referralRewardAmount

      try {
        await req.payload.create({
          collection: 'notifications',
          data: {
            actionLabel: 'Renew subscription',
            actionLink: '/dashboard/subscriptions',
            isActive: true,
            isRead: false,
            message: `A student you referred completed a ${paymentSettlement.plan} subscription payment. Your subscription was inactive, so you missed a ${missedRewardAmount.toLocaleString('en')} XAF referral bonus (${accountingSettings.referralRewardPercentage}%). Renew your subscription to qualify for future referral bonuses.`,
            metadata: {
              relatedContentId: transaction.id,
              relatedContentType: 'transactions',
              source: 'automated',
              tags: [
                { tag: 'referral' },
                { tag: 'missed-bonus' },
                { tag: 'subscription-inactive' },
              ],
            },
            priority: 'high',
            pushNotification: {
              sendPush: false,
            },
            recipient: referrerId,
            title: 'Referral bonus missed',
            type: 'referral',
          },
          req,
        })
      } catch (error) {
        req.payload.logger.error({
          err: error instanceof Error ? error : new Error(String(error)),
          msg: 'Unable to notify a referrer about an inactive-subscription bonus',
        })
      }
    }

    return reward
  } catch (error) {
    if (!isDuplicateRewardError(error)) throw error

    const existing = await req.payload.find({
      collection: 'referral-rewards',
      where: { paymentSettlement: { equals: paymentSettlement.id } },
      depth: 0,
      limit: 1,
      req,
    })
    return (existing.docs[0] as ReferralReward | undefined) ?? null
  }
}

export async function reverseReferralRewardForTransaction(
  req: PayloadRequest,
  transactionId: string,
  reason: string,
): Promise<ReferralReward | null> {
  const result = await req.payload.find({
    collection: 'referral-rewards',
    where: { transaction: { equals: transactionId } },
    depth: 0,
    limit: 1,
    req,
  })
  const reward = result.docs[0] as ReferralReward | undefined
  if (!reward || reward.status === 'reversed' || reward.status === 'ineligible') {
    return reward ?? null
  }

  return (await req.payload.update({
    collection: 'referral-rewards',
    id: reward.id,
    data: {
      reversalReason: reason,
      reversedAt: new Date().toISOString(),
      status: 'reversed',
    },
    req,
  })) as ReferralReward
}
