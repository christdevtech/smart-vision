import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type ReferralTokenData = {
  referralCode: string
  timestamp: number
  tokenId: string
}

export function generateReferralLink(referralCode: string, baseUrl?: string): string {
  const url = (baseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  return `${url}/referral/${encodeURIComponent(referralCode)}`
}

const signatureFor = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(payload).digest('base64url')

export function createReferralToken(
  referralCode: string,
  secret: string,
  timestamp = Date.now(),
  tokenId = randomBytes(12).toString('hex'),
): string {
  if (!secret) throw new Error('A referral signing secret is required')

  const payload = Buffer.from(
    JSON.stringify({ referralCode, timestamp, tokenId } satisfies ReferralTokenData),
  ).toString('base64url')
  return `${payload}.${signatureFor(payload, secret)}`
}

export function parseReferralToken(token: string, secret: string): ReferralTokenData | null {
  if (!token || !secret) return null

  try {
    const [payload, suppliedSignature, extra] = token.split('.')
    if (!payload || !suppliedSignature || extra) return null

    const expectedSignature = signatureFor(payload, secret)
    const supplied = Buffer.from(suppliedSignature)
    const expected = Buffer.from(expectedSignature)
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null

    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Partial<ReferralTokenData>
    if (
      typeof parsed.referralCode !== 'string' ||
      !/^\d{7}$/.test(parsed.referralCode) ||
      typeof parsed.timestamp !== 'number' ||
      !Number.isFinite(parsed.timestamp) ||
      typeof parsed.tokenId !== 'string' ||
      parsed.tokenId.length < 16
    ) {
      return null
    }

    return parsed as ReferralTokenData
  } catch {
    return null
  }
}

export function isReferralValid(timestamp: number, now = Date.now()): boolean {
  const oldestValidTimestamp = now - REFERRAL_CONSTANTS.COOKIE_MAX_AGE * 1000
  return timestamp <= now && timestamp > oldestValidTimestamp
}

export function extractReferralFromCookies(
  cookieHeader: string,
  secret: string,
  now = Date.now(),
): ReferralTokenData | null {
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)smartvision_referral=([^;]+)/)
  if (!cookieMatch) return null

  const referralData = parseReferralToken(decodeURIComponent(cookieMatch[1]), secret)
  if (!referralData || !isReferralValid(referralData.timestamp, now)) return null
  return referralData
}

export const REFERRAL_CONSTANTS = {
  COOKIE_NAME: 'smartvision_referral',
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60,
  REFERRAL_VALIDITY_DAYS: 30,
} as const

export function getReferralCookieOptions(
  isProduction: boolean = process.env.NODE_ENV === 'production',
) {
  return {
    httpOnly: true,
    maxAge: REFERRAL_CONSTANTS.COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
  }
}
