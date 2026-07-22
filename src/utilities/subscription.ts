import { Setting, Subscription, Transaction } from '@/payload-types'
import { Payload, PayloadRequest } from 'payload'

/**
 * Derived types from the generated Payload schema.
 * These stay in sync automatically whenever payload generate:types is re-run.
 */
export type SubscriptionPlan = Subscription['plan'] // 'free' | 'monthly' | 'annual'
export type SubscriptionStatus = NonNullable<Subscription['paymentStatus']> // 'pending' | 'paid' | 'failed' | 'expired'

export interface CreateSubscriptionParams {
  userId: string
  plan: SubscriptionPlan
  amount: number
  transactionId?: string
  paymentStatus?: SubscriptionStatus
}

export interface UpdateSubscriptionParams {
  subscriptionId: string
  plan: SubscriptionPlan
  amount: number
  transactionId?: string
}

/**
 * Determines subscription plan based on amount
 */
export function determineSubscriptionPlan(
  amount: number,
  subscriptionCosts: Setting['subscriptionCosts'],
): Exclude<SubscriptionPlan, 'free'> | null {
  const monthlyAmount = subscriptionCosts?.monthly || 500
  const yearlyAmount = subscriptionCosts?.yearly || 3500

  // Allow for small variations in amount (±5%)
  const tolerance = 0.05

  if (Math.abs(amount - monthlyAmount) <= monthlyAmount * tolerance) {
    return 'monthly'
  }

  if (Math.abs(amount - yearlyAmount) <= yearlyAmount * tolerance) {
    return 'annual'
  }

  return null
}

/**
 * Calculates subscription end date based on plan
 */
export function calculateSubscriptionEndDate(
  startDate: Date,
  plan: Exclude<SubscriptionPlan, 'free'>,
): Date {
  const endDate = new Date(startDate)

  if (plan === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else if (plan === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  return endDate
}

/**
 * Creates a new subscription for a user
 */
export async function createSubscription(
  payload: Payload,
  params: CreateSubscriptionParams,
  req?: PayloadRequest,
): Promise<Subscription> {
  const { userId, plan, amount: _amount, transactionId, paymentStatus = 'pending' } = params

  const startDate = new Date()
  // Free plan has no end date concept — default to 1 year ahead
  const endDate =
    plan === 'free'
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      : calculateSubscriptionEndDate(startDate, plan)

  const subscriptionData = {
    user: userId,
    plan,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentStatus,
    ...(transactionId ? { transactions: [transactionId] } : {}),
  }

  return (await payload.create({
    collection: 'subscriptions',
    data: subscriptionData,
    ...(req ? { req } : {}),
  })) as Subscription
}

/**
 * Updates an existing subscription with new plan and dates
 */
export async function updateSubscriptionAfterPayment(
  payload: Payload,
  params: UpdateSubscriptionParams,
  req?: PayloadRequest,
): Promise<Subscription> {
  const { subscriptionId, plan, transactionId } = params

  // Get current subscription
  const currentSubscription = (await payload.findByID({
    collection: 'subscriptions',
    id: subscriptionId,
    ...(req ? { req } : {}),
  })) as Subscription

  if (!currentSubscription) {
    throw new Error('Subscription not found')
  }

  const existingTransactionIds = (currentSubscription.transactions ?? []).map((transaction) =>
    typeof transaction === 'string' ? transaction : (transaction as Transaction).id,
  )

  // Defense in depth: a transaction already recorded on the subscription must never
  // extend it again, even if a caller bypasses the settlement ledger.
  if (transactionId && existingTransactionIds.includes(transactionId)) {
    return currentSubscription
  }

  const now = new Date()
  let startDate = now

  // If subscription is still active, extend from current end date
  if (currentSubscription.endDate && new Date(currentSubscription.endDate) > now) {
    startDate = new Date(currentSubscription.endDate)
  }

  const endDate =
    plan === 'free'
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      : calculateSubscriptionEndDate(startDate, plan)

  const updateData: {
    plan: SubscriptionPlan
    startDate: string
    endDate: string
    paymentStatus: SubscriptionStatus
    transactions?: string[]
  } = {
    plan,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentStatus: 'paid',
  }

  // Add transaction to the list if provided
  if (transactionId) {
    updateData.transactions = [...existingTransactionIds, transactionId]
  }

  return (await payload.update({
    collection: 'subscriptions',
    id: subscriptionId,
    data: updateData,
    ...(req ? { req } : {}),
  })) as Subscription
}

/**
 * Finds or creates a subscription for a user
 */
export async function findOrCreateUserSubscription(
  payload: Payload,
  userId: string,
  plan: SubscriptionPlan,
  amount: number,
  transactionId?: string,
  req?: PayloadRequest,
): Promise<Subscription> {
  // Check if user already has a subscription
  const existingSubscriptions = await payload.find({
    collection: 'subscriptions',
    where: {
      user: {
        equals: userId,
      },
    },
    limit: 1,
    sort: '-createdAt',
    ...(req ? { req } : {}),
  })

  if (existingSubscriptions.docs.length > 0) {
    const subscription = existingSubscriptions.docs[0] as Subscription
    return await updateSubscriptionAfterPayment(
      payload,
      {
        subscriptionId: subscription.id,
        plan,
        amount,
        transactionId,
      },
      req,
    )
  } else {
    return await createSubscription(
      payload,
      {
        userId,
        plan,
        amount,
        transactionId,
        paymentStatus: 'paid',
      },
      req,
    )
  }
}

/**
 * Checks if a subscription is currently active (paid & not expired).
 */
export function isSubscriptionActive(subscription: Subscription | null | undefined): boolean {
  if (!subscription || subscription.paymentStatus !== 'paid') {
    return false
  }

  const now = new Date()
  const endDate = new Date(subscription.endDate)

  return endDate > now
}

/**
 * Gets subscription costs from settings
 */
export async function getSubscriptionCosts(
  payload: Payload,
): Promise<Setting['subscriptionCosts']> {
  try {
    const settings = await payload.findGlobal({
      slug: 'settings',
    })

    return (
      settings?.subscriptionCosts || {
        monthly: 500,
        yearly: 3500,
      }
    )
  } catch (error) {
    console.error('Error fetching subscription costs:', error)
    return {
      monthly: 500,
      yearly: 3500,
    }
  }
}

/**
 * Subscription plan hierarchy.
 * Higher rank = more privileged. A user at rank N can access all content at rank ≤ N.
 */
export const PLAN_RANK: Record<SubscriptionPlan, number> = {
  free: 0,
  monthly: 1,
  annual: 2,
}

/**
 * Rank-based tier access check.
 *
 * A higher-tier subscriber is never blocked from lower-tier content:
 *   annual ⊇ monthly ⊇ free
 *
 * Rules:
 * - subscriptionRequired is false → always granted.
 * - bookTiers is empty → any active subscription suffices.
 * - Otherwise: userRank >= minRank(bookTiers) && subscriptionActive.
 */
export function hasTierAccess(
  userPlan: SubscriptionPlan,
  bookTiers: SubscriptionPlan[],
  subscriptionRequired: boolean | null | undefined,
  subscriptionActive: boolean,
): boolean {
  if (!subscriptionRequired) return true

  if (bookTiers.length === 0) return subscriptionActive

  const userRank = PLAN_RANK[userPlan]
  const minRequiredRank = Math.min(...bookTiers.map((t) => PLAN_RANK[t]))

  return subscriptionActive && userRank >= minRequiredRank
}
