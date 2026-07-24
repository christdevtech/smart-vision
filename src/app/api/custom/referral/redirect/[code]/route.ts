import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  createReferralToken,
  getReferralCookieOptions,
  isReferralValid,
  parseReferralToken,
  REFERRAL_CONSTANTS,
} from '@/utilities/referral'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params

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
    if (referrer.isActive === false) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    const signingSecret = process.env.REFERRAL_SIGNING_SECRET || process.env.PAYLOAD_SECRET
    if (!signingSecret) {
      return NextResponse.json({ error: 'Referral service is not configured' }, { status: 503 })
    }

    // First-touch attribution: do not replace a referral cookie that is already present.
    const cookieStore = await cookies()
    const existingCookie = cookieStore.get(REFERRAL_CONSTANTS.COOKIE_NAME)

    const existingAttribution = existingCookie
      ? parseReferralToken(existingCookie.value, signingSecret)
      : null

    if (existingAttribution && isReferralValid(existingAttribution.timestamp)) {
      return NextResponse.json({
        success: true,
        message: 'Referral attribution is already set',
        redirectUrl: '/',
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Referral code applied successfully',
      redirectUrl: '/',
    })

    const cookieOptions = getReferralCookieOptions()
    response.cookies.set(
      REFERRAL_CONSTANTS.COOKIE_NAME,
      createReferralToken(code, signingSecret),
      cookieOptions,
    )

    return response
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
