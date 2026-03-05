import { CollectionAfterChangeHook } from 'payload'

export const afterChangeTransaction: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only trigger on status changes during updates
  if (operation !== 'update') return doc
  if (doc.status === previousDoc?.status) return doc

  const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id
  if (!userId) return doc

  try {
    if (doc.status === 'successful') {
      // Payment success notification
      const planLabel = doc.amount >= 10000 ? 'Annual' : doc.amount >= 5000 ? 'Monthly' : 'Free'

      await req.payload.create({
        collection: 'notifications',
        data: {
          title: '✅ Payment Successful!',
          message: `Your ${planLabel} subscription is now active. Enjoy full access to all Smart Vision content.`,
          recipient: userId,
          type: 'subscription',
          priority: 'normal',
          isRead: false,
          isActive: true,
          actionLink: '/dashboard/subscriptions',
          actionLabel: 'View Subscription',
          pushNotification: { sendPush: false },
          metadata: {
            source: 'automated',
            relatedContentType: 'subscriptions',
            relatedContentId:
              typeof doc.subscription === 'string' ? doc.subscription : doc.subscription?.id,
            tags: [{ tag: 'payment' }, { tag: 'subscription' }],
          },
        },
      })
    } else if (doc.status === 'failed') {
      // Payment failure notification
      await req.payload.create({
        collection: 'notifications',
        data: {
          title: '⚠️ Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support.',
          recipient: userId,
          type: 'payment',
          priority: 'high',
          isRead: false,
          isActive: true,
          actionLink: '/dashboard/subscriptions',
          actionLabel: 'Retry Payment',
          pushNotification: { sendPush: false },
          metadata: {
            source: 'automated',
            relatedContentType: 'transactions',
            relatedContentId: doc.id,
            tags: [{ tag: 'payment' }, { tag: 'failed' }],
          },
        },
      })
    } else if (doc.status === 'expired') {
      await req.payload.create({
        collection: 'notifications',
        data: {
          title: '⏰ Subscription Expired',
          message:
            'Your subscription has expired. Renew now to keep access to all premium content.',
          recipient: userId,
          type: 'subscription',
          priority: 'high',
          isRead: false,
          isActive: true,
          actionLink: '/dashboard/subscriptions',
          actionLabel: 'Renew Now',
          pushNotification: { sendPush: false },
          metadata: {
            source: 'automated',
            tags: [{ tag: 'subscription' }, { tag: 'expired' }],
          },
        },
      })
    }
  } catch (error) {
    console.error('Error creating payment notification:', error)
  }

  return doc
}
