import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { REFERRAL_CONSTANTS, getReferralCookieOptions } from '@/utilities/referral'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
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

    // Check if referral cookie already exists
    const cookieStore = await cookies()
    const existingCookie = cookieStore.get(REFERRAL_CONSTANTS.COOKIE_NAME)
    
    if (existingCookie) {
      // Cookie already exists, redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Prepare cookie data
    const cookieData = {
      referrerId: referrer.id,
      referralCode: code,
      timestamp: Date.now()
    }
    
    // Create JSON response instead of redirect
    const response = NextResponse.json({
      success: true,
      message: 'Referral code applied successfully',
      redirectUrl: '/'
    })
    
    // Set HTTP-only cookie with referral information
    const cookieOptions = getReferralCookieOptions()
    response.cookies.set(REFERRAL_CONSTANTS.COOKIE_NAME, JSON.stringify(cookieData), cookieOptions)
    
    // Log for debugging (remove in production)
    console.log('Setting referral cookie:', {
      cookieName: REFERRAL_CONSTANTS.COOKIE_NAME,
      cookieData,
      cookieOptions
    })

    return response
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}