import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { ReferralAttribution, ReferralReward, Subscription, User } from '@/payload-types'
import { generateReferralLink } from '@/utilities/referral'
import { getPaymentAccountingSettings } from '@/utilities/paymentAccounting'
import { isSubscriptionActive } from '@/utilities/subscription'

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user: authenticatedUser } = await payload.auth({ headers: request.headers })
    const user = authenticatedUser as User | null

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = { overrideAccess: false as const, user }
    const [attributionResult, rewardResult, subscriptionResult, accounting] = await Promise.all([
      payload.find({
        ...access,
        collection: 'referral-attributions',
        where: {
          and: [
            { referrer: { equals: user.id } },
            { status: { in: ['valid', 'legacy-unverified'] } },
          ],
        },
        depth: 1,
        limit: 100,
        sort: '-attributedAt',
      }),
      payload.find({
        ...access,
        collection: 'referral-rewards',
        where: { referrer: { equals: user.id } },
        depth: 0,
        limit: 10_000,
        pagination: false,
        sort: '-settledAt',
      }),
      payload.find({
        ...access,
        collection: 'subscriptions',
        where: {
          and: [
            { user: { equals: user.id } },
            { paymentStatus: { equals: 'paid' } },
            { plan: { in: ['monthly', 'annual'] } },
            { endDate: { greater_than: new Date().toISOString() } },
          ],
        },
        depth: 0,
        limit: 1,
        sort: '-endDate',
      }),
      getPaymentAccountingSettings(payload),
    ])

    const rewards = rewardResult.docs as ReferralReward[]
    const attributions = attributionResult.docs as ReferralAttribution[]
    const activeSubscription = subscriptionResult.docs[0] as Subscription | undefined
    const qualifiedReferrals = new Set(
      rewards
        .filter((reward) => ['available', 'paid'].includes(reward.status))
        .map((reward) => relationshipId(reward.referredUser))
        .filter(Boolean),
    ).size
    const sumRewards = (statuses: ReferralReward['status'][]) =>
      rewards
        .filter((reward) => statuses.includes(reward.status))
        .reduce((total, reward) => total + reward.rewardAmount, 0)

    return NextResponse.json({
      eligibility: {
        active: isSubscriptionActive(activeSubscription),
        subscriptionEndDate: activeSubscription?.endDate || null,
      },
      program: {
        enabled: accounting.referralProgramEnabled,
        providerFeePercentage: accounting.providerFeePercentage,
        rewardPercentage: accounting.referralRewardPercentage,
      },
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode || ''),
      referredBy: relationshipId(user.referredBy),
      referredUsers: attributions.map((attribution) => {
        const referredUser =
          typeof attribution.referredUser === 'object' ? attribution.referredUser : null
        return {
          firstName: referredUser?.firstName || 'Student',
          id: relationshipId(attribution.referredUser),
          joinedAt: attribution.attributedAt,
          status: attribution.status,
        }
      }),
      rewards: rewards.slice(0, 25).map((reward) => ({
        amount: reward.rewardAmount,
        grossPaymentAmount: reward.grossPaymentAmount,
        id: reward.id,
        plan: reward.plan,
        ratePercentage: reward.rewardRateBasisPoints / 100,
        settledAt: reward.settledAt,
        status: reward.status,
      })),
      summary: {
        availableEarnings: sumRewards(['available']),
        paidEarnings: sumRewards(['paid']),
        qualifiedReferrals,
        reversedEarnings: sumRewards(['reversed']),
        totalEarnings: sumRewards(['available', 'paid']),
        totalReferrals: attributionResult.totalDocs,
      },
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
