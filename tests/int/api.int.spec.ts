import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import {
  createReferralToken,
  extractReferralFromCookies,
  generateReferralLink,
  isReferralValid,
} from '@/utilities/referral'

import { describe, it, beforeAll, expect, afterEach } from 'vitest'

let payload: Payload
const referralSigningSecret =
  process.env.REFERRAL_SIGNING_SECRET || process.env.PAYLOAD_SECRET || 'test-referral-secret'

describe('API', () => {
  beforeAll(async () => {
    process.env.REFERRAL_SIGNING_SECRET = referralSigningSecret
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterEach(async () => {
    // Clean up test users after each test
    const testUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          contains: 'test-referral',
        },
      },
    })

    for (const user of testUsers.docs) {
      await payload.delete({
        collection: 'users',
        id: user.id,
      })
    }
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  describe('Referral System', () => {
    it('generates unique referral codes for new users', async () => {
      const user1 = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-1@example.com',
          password: 'StrongPass1!',
          firstName: 'Test',
          lastName: 'User1',
          role: 'user',
        },
      })

      const user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-2@example.com',
          password: 'StrongPass1!',
          firstName: 'Test',
          lastName: 'User2',
          role: 'user',
        },
      })

      expect(user1.referralCode).toBeDefined()
      expect(user2.referralCode).toBeDefined()
      expect(user1.referralCode).not.toBe(user2.referralCode)
      expect(user1.referralCode).toMatch(/^\d{7}$/)
      expect(user2.referralCode).toMatch(/^\d{7}$/)
    })

    it('tracks referrals when cookie is present', async () => {
      // Create referrer user
      const referrer = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-referrer@example.com',
          password: 'StrongPass1!',
          firstName: 'Referrer',
          lastName: 'User',
          role: 'user',
        },
      })

      // Simulate cookie with referral data
      const cookieValue = `smartvision_referral=${encodeURIComponent(
        createReferralToken(referrer.referralCode!, referralSigningSecret),
      )}`

      // Create new user with referral cookie in request
      const mockReq = {
        payload,
        headers: new Headers({ cookie: cookieValue }),
      }

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-referred@example.com',
          password: 'StrongPass1!',
          firstName: 'Referred',
          lastName: 'User',
          role: 'user',
        },
        req: mockReq as any,
      })

      // Check that referral was tracked
      expect(newUser.referredBy).toBe(referrer.id)

      const attributions = await payload.count({
        collection: 'referral-attributions',
        where: {
          and: [{ referrer: { equals: referrer.id } }, { referredUser: { equals: newUser.id } }],
        },
      })
      expect(attributions.totalDocs).toBe(1)
    })

    it('does not track referrals with expired cookies', async () => {
      // Create referrer user
      const referrer = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-referrer-expired@example.com',
          password: 'StrongPass1!',
          firstName: 'Referrer',
          lastName: 'Expired',
          role: 'user',
        },
      })

      // Simulate expired cookie (31 days ago)
      const expiredTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000
      const cookieValue = `smartvision_referral=${encodeURIComponent(
        createReferralToken(
          referrer.referralCode!,
          referralSigningSecret,
          expiredTimestamp,
          'expired-referral-token',
        ),
      )}`

      // Create new user with expired referral cookie
      const mockReq = {
        payload,
        headers: new Headers({ cookie: cookieValue }),
      }

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-not-referred@example.com',
          password: 'StrongPass1!',
          firstName: 'Not',
          lastName: 'Referred',
          role: 'user',
        },
        req: mockReq as any,
      })

      // Check that referral was NOT tracked
      expect(newUser.referredBy).toBeUndefined()

      const attributions = await payload.count({
        collection: 'referral-attributions',
        where: {
          referrer: { equals: referrer.id },
        },
      })
      expect(attributions.totalDocs).toBe(0)
    })
  })

  describe('Referral Utilities', () => {
    it('generates correct referral links', () => {
      const code = '1234567'
      const link = generateReferralLink(code, 'https://example.com')
      expect(link).toBe('https://example.com/referral/1234567')
    })

    it('validates referral timestamps correctly', () => {
      const now = Date.now()
      const validTimestamp = now - 10 * 24 * 60 * 60 * 1000 // 10 days ago
      const expiredTimestamp = now - 31 * 24 * 60 * 60 * 1000 // 31 days ago

      expect(isReferralValid(validTimestamp)).toBe(true)
      expect(isReferralValid(expiredTimestamp)).toBe(false)
    })

    it('extracts referral data from cookies correctly', () => {
      const timestamp = Date.now()
      const token = createReferralToken(
        '1234567',
        referralSigningSecret,
        timestamp,
        'valid-referral-token',
      )
      const cookieValue = `other=value; smartvision_referral=${encodeURIComponent(token)}; another=value`
      const extracted = extractReferralFromCookies(cookieValue, referralSigningSecret)

      expect(extracted).toEqual({
        referralCode: '1234567',
        timestamp,
        tokenId: 'valid-referral-token',
      })
    })

    it('returns null for invalid or expired cookies', () => {
      const token = createReferralToken(
        '1234567',
        referralSigningSecret,
        Date.now() - 31 * 24 * 60 * 60 * 1000,
        'expired-referral-token',
      )
      const cookieValue = `smartvision_referral=${encodeURIComponent(token)}`
      const extracted = extractReferralFromCookies(cookieValue, referralSigningSecret)

      expect(extracted).toBeNull()
    })
  })
})
