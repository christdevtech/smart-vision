import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayload({ config })

    // Get user from authentication
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get users referred by this user
    const referredUsers = await payload.find({
      collection: 'users',
      where: {
        referredBy: {
          equals: user.id,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      sort: '-createdAt',
    })

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/referral/${user.referralCode}`

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      totalReferrals: user.totalReferrals || 0,
      referredUsers: referredUsers.docs,
      referredBy: user.referredBy || null,
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
