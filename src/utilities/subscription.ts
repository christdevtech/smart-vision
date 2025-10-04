import { Setting, Subscription } from '@/payload-types'
import { Payload } from 'payload'

export interface SubscriptionPlan {
  type: 'monthly' | 'yearly'
  duration: number // in days
  amount: number
}

export interface CreateSubscriptionParams {
  userId: string
  plan: 'monthly' | 'annual'
  amount: number
  transactionId?: string
}

export interface UpdateSubscriptionParams {
  subscriptionId: string
  plan: 'monthly' | 'annual'
  amount: number
  transactionId?: string
}

/**
 * Determines subscription plan based on amount
 */
export function determineSubscriptionPlan(
  amount: number,
  subscriptionCosts: any,
): 'monthly' | 'annual' | null {
  const monthlyAmount = subscriptionCosts?.monthly || 3000
  const yearlyAmount = subscriptionCosts?.yearly || 30000

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
export function calculateSubscriptionEndDate(startDate: Date, plan: 'monthly' | 'annual'): Date {
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
): Promise<Subscription> {
  const { userId, plan, amount, transactionId } = params

  const startDate = new Date()
  const endDate = calculateSubscriptionEndDate(startDate, plan)

  const subscriptionData: any = {
    user: userId,
    plan,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentStatus: 'pending',
  }

  if (transactionId) {
    subscriptionData.transactions = [transactionId]
  }

  return await payload.create({
    collection: 'subscriptions',
    data: subscriptionData,
  })
}

/**
 * Updates an existing subscription with new plan and dates
 */
export async function updateSubscriptionAfterPayment(
  payload: Payload,
  params: UpdateSubscriptionParams,
): Promise<Subscription> {
  const { subscriptionId, plan, amount, transactionId } = params

  // Get current subscription
  const currentSubscription = await payload.findByID({
    collection: 'subscriptions',
    id: subscriptionId,
  })

  if (!currentSubscription) {
    throw new Error('Subscription not found')
  }

  const now = new Date()
  let startDate = now

  // If subscription is still active, extend from current end date
  if (currentSubscription.endDate && new Date(currentSubscription.endDate) > now) {
    startDate = new Date(currentSubscription.endDate)
  }

  const endDate = calculateSubscriptionEndDate(startDate, plan)

  const updateData: any = {
    plan,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentStatus: 'paid',
  }

  // Add transaction to the list if provided
  if (transactionId) {
    const existingTransactions = currentSubscription.transactions || []
    if (!existingTransactions.includes(transactionId)) {
      updateData.transactions = [...existingTransactions, transactionId]
    }
  }

  return await payload.update({
    collection: 'subscriptions',
    id: subscriptionId,
    data: updateData,
  })
}

/**
 * Finds or creates a subscription for a user
 */
export async function findOrCreateUserSubscription(
  payload: Payload,
  userId: string,
  plan: 'monthly' | 'annual',
  amount: number,
  transactionId?: string,
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
  })

  if (existingSubscriptions.docs.length > 0) {
    // Update existing subscription
    const subscription = existingSubscriptions.docs[0]
    return await updateSubscriptionAfterPayment(payload, {
      subscriptionId: subscription.id,
      plan,
      amount,
      transactionId,
    })
  } else {
    // Create new subscription
    return await createSubscription(payload, {
      userId,
      plan,
      amount,
      transactionId,
    })
  }
}

/**
 * Checks if a subscription is currently active
 */
export function isSubscriptionActive(subscription: any): boolean {
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
        monthly: 3000,
        yearly: 30000,
      }
    )
  } catch (error) {
    console.error('Error fetching subscription costs:', error)
    return {
      monthly: 3000,
      yearly: 30000,
    }
  }
}
