import { CollectionBeforeChangeHook } from 'payload'
import { extractReferralFromCookies } from '@/utilities/referral'

// Function to generate a unique 7-digit code
const generateUniqueCode = async (payload: any): Promise<string> => {
  let code: string
  let isUnique = false

  while (!isUnique) {
    // Generate a random 7-digit number
    code = Math.floor(1000000 + Math.random() * 9000000).toString()

    // Check if this code already exists
    const existing = await payload.find({
      collection: 'users',
      where: {
        referralCode: {
          equals: code,
        },
      },
    })

    if (existing.docs.length === 0) {
      isUnique = true
    }
  }

  return code!
}

export const beforeChangeUser: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Auto-generate referralCode for new users
  if (operation === 'create' || !data.referralCode) {
    data.referralCode = await generateUniqueCode(req.payload)
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
