import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateReferralLink } from '@/utilities/referral'

export async function GET(request: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayload({ config })

    // Get user from authentication
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const referralCount = await payload.count({
      collection: 'referral-attributions',
      where: {
        and: [
          { referrer: { equals: user.id } },
          { status: { in: ['valid', 'legacy-unverified'] } },
        ],
      },
      overrideAccess: false,
      user,
    })

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode || ''),
      totalReferrals: referralCount.totalDocs,
    })
  } catch (error) {
    console.error('Error generating referral link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user: authenticatedUser } = await payload.auth({ headers: request.headers })

    if (!authenticatedUser || !['admin', 'super-admin'].includes(authenticatedUser.role)) {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const result = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result.docs[0]

    const referralCount = await payload.count({
      collection: 'referral-attributions',
      where: {
        and: [
          { referrer: { equals: user.id } },
          { status: { in: ['valid', 'legacy-unverified'] } },
        ],
      },
    })

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode || ''),
      totalReferrals: referralCount.totalDocs,
    })
  } catch (error) {
    console.error('Error generating referral link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
