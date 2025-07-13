import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { extractReferralFromCookies, generateReferralLink, isReferralValid } from '@/utilities/referral'

import { describe, it, beforeAll, expect, afterEach } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
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
          password: 'password123',
          firstName: 'Test',
          lastName: 'User1',
        },
      })

      const user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-2@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User2',
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
          password: 'password123',
          firstName: 'Referrer',
          lastName: 'User',
        },
      })

      // Simulate cookie with referral data
      const cookieValue = `smartvision_referral=${encodeURIComponent(JSON.stringify({
        referrerId: referrer.id,
        referralCode: referrer.referralCode,
        timestamp: Date.now()
      }))}`

      // Create new user with referral cookie in request
      const mockReq = {
        payload,
        headers: {
          cookie: cookieValue,
        },
      }

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-referred@example.com',
          password: 'password123',
          firstName: 'Referred',
          lastName: 'User',
        },
        req: mockReq as any,
      })

      // Check that referral was tracked
      expect(newUser.referredBy).toBe(referrer.id)

      // Check that referrer's count was incremented
      const updatedReferrer = await payload.findByID({
        collection: 'users',
        id: referrer.id,
      })
      expect(updatedReferrer.totalReferrals).toBe(1)
    })

    it('does not track referrals with expired cookies', async () => {
      // Create referrer user
      const referrer = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-referrer-expired@example.com',
          password: 'password123',
          firstName: 'Referrer',
          lastName: 'Expired',
        },
      })

      // Simulate expired cookie (31 days ago)
      const expiredTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000)
      const cookieValue = `smartvision_referral=${encodeURIComponent(JSON.stringify({
        referrerId: referrer.id,
        referralCode: referrer.referralCode,
        timestamp: expiredTimestamp
      }))}`

      // Create new user with expired referral cookie
      const mockReq = {
        payload,
        headers: {
          cookie: cookieValue,
        },
      }

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: 'test-referral-not-referred@example.com',
          password: 'password123',
          firstName: 'Not',
          lastName: 'Referred',
        },
        req: mockReq as any,
      })

      // Check that referral was NOT tracked
      expect(newUser.referredBy).toBeUndefined()

      // Check that referrer's count was NOT incremented
      const updatedReferrer = await payload.findByID({
        collection: 'users',
        id: referrer.id,
      })
      expect(updatedReferrer.totalReferrals).toBe(0)
    })
  })

  describe('Referral Utilities', () => {
    it('generates correct referral links', () => {
      const code = '1234567'
      const link = generateReferralLink(code, 'https://example.com')
      expect(link).toBe('https://example.com/api/custom/referral/redirect/1234567')
    })

    it('validates referral timestamps correctly', () => {
      const now = Date.now()
      const validTimestamp = now - (10 * 24 * 60 * 60 * 1000) // 10 days ago
      const expiredTimestamp = now - (31 * 24 * 60 * 60 * 1000) // 31 days ago

      expect(isReferralValid(validTimestamp)).toBe(true)
      expect(isReferralValid(expiredTimestamp)).toBe(false)
    })

    it('extracts referral data from cookies correctly', () => {
      const referralData = {
        referrerId: 'user123',
        referralCode: '1234567',
        timestamp: Date.now()
      }
      
      const cookieValue = `other=value; smartvision_referral=${encodeURIComponent(JSON.stringify(referralData))}; another=value`
      const extracted = extractReferralFromCookies(cookieValue)
      
      expect(extracted).toEqual(referralData)
    })

    it('returns null for invalid or expired cookies', () => {
      const expiredData = {
        referrerId: 'user123',
        referralCode: '1234567',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      }
      
      const cookieValue = `smartvision_referral=${encodeURIComponent(JSON.stringify(expiredData))}`
      const extracted = extractReferralFromCookies(cookieValue)
      
      expect(extracted).toBeNull()
    })
  })
})
