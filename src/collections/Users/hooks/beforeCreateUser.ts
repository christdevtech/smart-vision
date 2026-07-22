import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { extractReferralFromCookies } from '@/utilities/referral'

// Function to generate a unique 7-digit code
const generateUniqueCode = async (req: PayloadRequest): Promise<string> => {
  let code: string
  let isUnique = false

  while (!isUnique) {
    // Generate a random 7-digit number
    code = Math.floor(1000000 + Math.random() * 9000000).toString()

    // Check if this code already exists
    const existing = await req.payload.find({
      collection: 'users',
      where: {
        referralCode: {
          equals: code,
        },
      },
      req,
    })

    if (existing.docs.length === 0) {
      isUnique = true
    }
  }

  return code!
}

export const beforeChangeUser: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Generate once for new users and backfill legacy users that do not have a code.
  // Update payloads are partial, so checking data.referralCode alone would regenerate the code.
  if (operation === 'create' || !originalDoc?.referralCode) {
    data.referralCode = await generateUniqueCode(req)
  }

  // Handle referral tracking for new users
  if (operation === 'create' && !data.referredBy) {
    try {
      // Check for referral cookie in the request
      const cookies = req.headers.get('cookie')
      if (cookies) {
        const referralData = extractReferralFromCookies(cookies)

        if (referralData) {
          const { referrerId } = referralData

          // Verify the referrer still exists
          const referrer = await req.payload.findByID({
            collection: 'users',
            id: referrerId,
            req,
          })

          if (referrer) {
            data.referredBy = referrerId

            // Increment the referrer's total referrals count
            await req.payload.update({
              collection: 'users',
              id: referrerId,
              data: {
                totalReferrals: (referrer.totalReferrals || 0) + 1,
              },
              req,
            })
          }
        }
      }
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Error processing referral during user creation:', error)
    }
  }

  return data
}
