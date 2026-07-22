import { CollectionAfterChangeHook } from 'payload'

export const afterChangeUser: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation === 'update' && previousDoc?.isActive !== false && doc.isActive === false) {
    try {
      await req.payload.db.updateOne({
        collection: 'users',
        id: doc.id,
        data: { sessions: [] },
        req,
        returning: false,
      })
    } catch (error) {
      req.payload.logger.error({
        err: error,
        msg: 'Could not revoke sessions for deactivated user',
      })
      throw error
    }

    return doc
  }

  // Only create the welcome notification for new accounts.
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
      req,
    })
  } catch (error) {
    // Don't block user creation if notification fails
    console.error('Error creating welcome notification:', error)
  }

  return doc
}
