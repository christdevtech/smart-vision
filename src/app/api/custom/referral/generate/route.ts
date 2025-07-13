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

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/referral/${user.referralCode}`

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      totalReferrals: user.totalReferrals || 0,
    })
  } catch (error) {
    console.error('Error generating referral link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get payload instance
    const payload = await getPayload({ config })

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

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/referral/${user.referralCode}`

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      totalReferrals: user.totalReferrals || 0,
    })
  } catch (error) {
    console.error('Error generating referral link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
