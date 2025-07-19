/**
 * Utility functions for referral system
 */

/**
 * Generate a referral link for a given referral code
 * @param referralCode - The user's referral code
 * @param baseUrl - Optional base URL, defaults to NEXT_PUBLIC_SERVER_URL or localhost
 * @returns Complete referral link
 */
export function generateReferralLink(referralCode: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return `${url}/referral/${referralCode}`
}

/**
 * Parse referral cookie data
 * @param cookieValue - The cookie value to parse
 * @returns Parsed referral data or null if invalid
 */
export function parseReferralCookie(cookieValue: string): {
  referrerId: string
  referralCode: string
  timestamp: number
} | null {
  try {
    const data = JSON.parse(decodeURIComponent(cookieValue))
    if (data.referrerId && data.referralCode && data.timestamp) {
      return data
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check if a referral cookie is still valid (within 30 days)
 * @param timestamp - The timestamp from the referral cookie
 * @returns True if the referral is still valid
 */
export function isReferralValid(timestamp: number): boolean {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  return timestamp > thirtyDaysAgo
}

/**
 * Extract referral cookie from request headers
 * @param cookieHeader - The cookie header string
 * @returns Parsed referral data or null
 */
export function extractReferralFromCookies(cookieHeader: string): {
  referrerId: string
  referralCode: string
  timestamp: number
} | null {
  const cookieMatch = cookieHeader.match(/smartvision_referral=([^;]+)/)
  if (!cookieMatch) return null
  
  const referralData = parseReferralCookie(cookieMatch[1])
  if (!referralData || !isReferralValid(referralData.timestamp)) {
    return null
  }
  
  return referralData
}

/**
 * Constants for referral system
 */
export const REFERRAL_CONSTANTS = {
  COOKIE_NAME: 'smartvision_referral',
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  REFERRAL_VALIDITY_DAYS: 30,
} as const

/**
 * Create referral cookie options
 * @param isProduction - Whether the app is in production mode
 * @returns Cookie options object
 */
export function getReferralCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction, // Only secure in production (HTTPS)
    sameSite: 'lax' as const,
    maxAge: REFERRAL_CONSTANTS.COOKIE_MAX_AGE,
    path: '/',
    // Ensure cookie works in development
    domain: isProduction ? undefined : undefined // Let browser handle domain
  }
}