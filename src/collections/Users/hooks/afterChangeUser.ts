import { CollectionAfterChangeHook } from 'payload'

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }
  return null
}

const isDuplicateAttributionError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? error.code : undefined
  const message = 'message' in error ? String(error.message) : ''
  return code === 11000 || /duplicate key|unique constraint/i.test(message)
}

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

  const referrerId = relationshipId(doc.referredBy)
  if (referrerId) {
    const contextAttribution = req.context.referralAttribution as
      | { referralCode?: string; tokenId?: string }
      | undefined

    try {
      let referralCode = contextAttribution?.referralCode
      if (!referralCode) {
        const referrer = await req.payload.findByID({
          collection: 'users',
          id: referrerId,
          depth: 0,
          req,
        })
        referralCode = referrer.referralCode || undefined
      }

      if (!referralCode) throw new Error('Referrer does not have a referral code')

      await req.payload.create({
        collection: 'referral-attributions',
        data: {
          attributedAt: new Date().toISOString(),
          referralCode,
          referredUser: doc.id,
          referrer: referrerId,
          source: contextAttribution ? 'signed-cookie' : 'admin',
          status: 'valid',
          ...(contextAttribution?.tokenId ? { tokenId: contextAttribution.tokenId } : {}),
        },
        req,
      })
    } catch (error) {
      if (!isDuplicateAttributionError(error)) {
        req.payload.logger.error({
          err: error instanceof Error ? error : new Error(String(error)),
          msg: 'Could not persist referral attribution',
        })
        throw error
      }
    }
  }

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
