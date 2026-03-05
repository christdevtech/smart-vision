import { CollectionAfterChangeHook } from 'payload'

export const afterChangeUser: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Only act on create
  if (operation !== 'create') return doc

  try {
    await req.payload.create({
      collection: 'notifications',
      data: {
        title: '🎉 Welcome to Smart Vision!',
        message: `Hi ${doc.firstName || 'there'}! Your account is ready. Complete your profile and start your learning journey.`,
        recipient: doc.id,
        type: 'system',
        priority: 'normal',
        isRead: false,
        isActive: true,
        actionLink: '/dashboard/account',
        actionLabel: 'Complete Profile',
        pushNotification: {
          sendPush: false,
        },
        metadata: {
          source: 'automated',
          tags: [{ tag: 'welcome' }],
        },
      },
    })
  } catch (error) {
    // Don't block user creation if notification fails
    console.error('Error creating welcome notification:', error)
  }

  return doc
}
