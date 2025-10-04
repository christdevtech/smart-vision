import { CollectionAfterChangeHook } from 'payload'
import {
  determineSubscriptionPlan,
  findOrCreateUserSubscription,
  getSubscriptionCosts,
  updateSubscriptionAfterPayment,
} from '@/utilities/subscription'

export const updateSubscriptions: CollectionAfterChangeHook = async ({
  req,
  operation,
  doc,
  previousDoc,
}) => {
  // Only proceed if this is an update operation
  if (operation !== 'update') return doc

  // Only proceed if status changed to successful
  if (doc.status !== 'successful' || previousDoc.status === 'successful') return doc

  // Only proceed if there's a user reference
  if (!doc.user) return doc

  try {
    const payload = req.payload

    // Extract user ID (handle both string ID and populated object)
    const userId = typeof doc.user === 'string' ? doc.user : doc.user.id

    // Get subscription costs to determine plan
    const subscriptionCosts = await getSubscriptionCosts(payload)

    // Determine subscription plan based on transaction amount
    const plan = determineSubscriptionPlan(doc.amount, subscriptionCosts)

    if (plan) {
      // Check if transaction is already linked to a subscription
      if (doc.subscription) {
        // Extract subscription ID (handle both string ID and populated object)
        const subscriptionId = typeof doc.subscription === 'string' 
          ? doc.subscription 
          : doc.subscription.id

        // Get the subscription
        const subscription = await payload.findByID({
          collection: 'subscriptions',
          id: subscriptionId,
        })

        // Check if this transaction is already in the subscription's transactions array
        const transactionExists =
          subscription.transactions &&
          Array.isArray(subscription.transactions) &&
          subscription.transactions.some(
            (transId) =>
              transId === doc.id || (typeof transId === 'object' && transId.id === doc.id),
          )

        // If transaction is not already processed, extend the subscription
        if (!transactionExists) {
          await updateSubscriptionAfterPayment(payload, {
            subscriptionId,
            plan,
            amount: doc.amount,
            transactionId: doc.id,
          })
          console.log(`Extended subscription ${subscriptionId} with transaction ${doc.id}, plan: ${plan}`)
        }
      } else {
        // No subscription linked, create or update one
        const subscription = await findOrCreateUserSubscription(
          payload,
          userId,
          plan,
          doc.amount,
          doc.id,
        )

        // Update transaction with subscription reference
        await payload.update({
          collection: 'transactions',
          id: doc.id,
          data: {
            subscription: subscription.id,
          },
        })

        console.log(
          `Created/updated subscription ${subscription.id} for user ${userId}, plan: ${plan}`,
        )
      }
    }
  } catch (error) {
    console.error('Error in transaction afterChange hook:', error)
  }

  return doc
}
