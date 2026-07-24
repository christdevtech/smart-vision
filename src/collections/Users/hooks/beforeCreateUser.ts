import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { randomInt } from 'node:crypto'
import { extractReferralFromCookies } from '@/utilities/referral'

// Function to generate a unique 7-digit code
const generateUniqueCode = async (req: PayloadRequest): Promise<string> => {
  let code: string
  let isUnique = false

  while (!isUnique) {
    // Generate a random 7-digit number
    code = randomInt(1_000_000, 10_000_000).toString()

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
      const cookieHeader = req.headers.get('cookie')
      const signingSecret = process.env.REFERRAL_SIGNING_SECRET || process.env.PAYLOAD_SECRET
      if (cookieHeader && signingSecret) {
        const referralData = extractReferralFromCookies(cookieHeader, signingSecret)

        if (referralData) {
          const referrerResult = await req.payload.find({
            collection: 'users',
            where: {
              referralCode: {
                equals: referralData.referralCode,
              },
            },
            limit: 1,
            depth: 0,
            req,
          })
          const referrer = referrerResult.docs[0]

          if (
            referrer &&
            referrer.isActive !== false &&
            String(referrer.email).toLowerCase() !== String(data.email || '').toLowerCase()
          ) {
            data.referredBy = referrer.id
            req.context.referralAttribution = {
              referralCode: referralData.referralCode,
              tokenId: referralData.tokenId,
            }
          }
        }
      }
    } catch (error) {
      // Log error but don't fail user creation
      req.payload.logger.error({
        err: error instanceof Error ? error : new Error(String(error)),
        msg: 'Referral attribution could not be evaluated during user creation',
      })
    }
  }

  return data
}
