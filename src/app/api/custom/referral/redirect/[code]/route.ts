import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { REFERRAL_CONSTANTS, getReferralCookieOptions } from '@/utilities/referral'

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    
    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Get payload instance
    const payload = await getPayload({ config })

    // Find user with the referral code
    const result = await payload.find({
      collection: 'users',
      where: {
        referralCode: {
          equals: code,
        },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    const referrer = result.docs[0]

    // Create response and set HTTP-only cookie
    const response = NextResponse.redirect(new URL('/', request.url))
    
    // Set HTTP-only cookie with referral information
    response.cookies.set(REFERRAL_CONSTANTS.COOKIE_NAME, JSON.stringify({
      referrerId: referrer.id,
      referralCode: code,
      timestamp: Date.now()
    }), getReferralCookieOptions())

    return response
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}