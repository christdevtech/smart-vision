import { describe, expect, it, vi } from 'vitest'

import {
  createReferralRewardForSettlement,
  reverseReferralRewardForTransaction,
} from '@/services/referralRewards'
import {
  createReferralToken,
  extractReferralFromCookies,
  parseReferralToken,
} from '@/utilities/referral'
import { calculatePaymentAccounting } from '@/utilities/paymentAccounting'

describe('payment and referral accounting', () => {
  it('records the configured 3% provider fee and 30% gross referral reward', () => {
    expect(
      calculatePaymentAccounting({
        amount: 10_000,
        providerFeePercentage: 3,
        referralRewardPercentage: 30,
      }),
    ).toEqual({
      grossAmount: 10_000,
      platformRevenueAfterReward: 6_700,
      providerFeeAmount: 300,
      providerFeeRateBasisPoints: 300,
      referralRewardAmount: 3_000,
      referralRewardRateBasisPoints: 3_000,
      revenue: 9_700,
    })
  })

  it('uses provider-reported revenue as the authoritative fee amount', () => {
    expect(
      calculatePaymentAccounting({
        amount: 10_000,
        providerFeePercentage: 3,
        providerRevenue: 9_650,
        referralRewardPercentage: 30,
      }),
    ).toMatchObject({
      platformRevenueAfterReward: 6_650,
      providerFeeAmount: 350,
      providerFeeRateBasisPoints: 350,
      revenue: 9_650,
    })
  })

  it('rejects tampered or expired signed attribution tokens', () => {
    const secret = 'a-strong-test-referral-secret'
    const now = Date.now()
    const token = createReferralToken('1234567', secret, now, 'test-referral-token')
    const cookie = `other=value; smartvision_referral=${encodeURIComponent(token)}`

    expect(parseReferralToken(token, secret)).toMatchObject({
      referralCode: '1234567',
      timestamp: now,
      tokenId: 'test-referral-token',
    })
    expect(extractReferralFromCookies(cookie, secret, now)).not.toBeNull()
    expect(parseReferralToken(`${token.slice(0, -1)}x`, secret)).toBeNull()
    expect(
      extractReferralFromCookies(
        `smartvision_referral=${encodeURIComponent(
          createReferralToken(
            '1234567',
            secret,
            now - 31 * 24 * 60 * 60 * 1000,
            'expired-referral-token',
          ),
        )}`,
        secret,
        now,
      ),
    ).toBeNull()
  })

  it('creates one available reward when the referrer subscription is active', async () => {
    const createdReward = { id: 'reward-1', status: 'available' }
    const payload = {
      create: vi.fn().mockResolvedValue(createdReward),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [{ id: 'attribution-1' }] })
        .mockResolvedValueOnce({ docs: [{ id: 'subscription-1' }] }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({ id: 'referred-1', referredBy: 'referrer-1' })
        .mockResolvedValueOnce({ id: 'referrer-1', isActive: true }),
      findGlobal: vi.fn().mockResolvedValue({
        paymentAccounting: {
          providerFeePercentage: 3,
          referralProgramEnabled: true,
          referralRewardPercentage: 30,
        },
      }),
      logger: { error: vi.fn() },
    }
    const req = { payload } as any

    const reward = await createReferralRewardForSettlement({
      paymentSettlement: {
        amount: 10_000,
        id: 'settlement-1',
        plan: 'monthly',
        revenue: 9_700,
        user: 'referred-1',
        verifiedAt: '2026-07-24T12:00:00.000Z',
      } as any,
      referredSubscription: { id: 'referred-subscription-1' } as any,
      req,
      transaction: { id: 'transaction-1' } as any,
    })

    expect(reward).toBe(createdReward)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'referral-rewards',
        data: expect.objectContaining({
          grossPaymentAmount: 10_000,
          platformRevenueAfterReward: 6_700,
          providerFeeAmount: 300,
          referredUser: 'referred-1',
          referrer: 'referrer-1',
          revenue: 9_700,
          rewardAmount: 3_000,
          rewardRateBasisPoints: 3_000,
          status: 'available',
        }),
      }),
    )
  })

  it('keeps an audit record but awards zero when the referrer subscription is inactive', async () => {
    const payload = {
      create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'reward-2', ...data })),
      find: vi.fn().mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({ id: 'referred-1', referredBy: 'referrer-1' })
        .mockResolvedValueOnce({ id: 'referrer-1', isActive: true }),
      findGlobal: vi.fn().mockResolvedValue({
        paymentAccounting: {
          providerFeePercentage: 3,
          referralProgramEnabled: true,
          referralRewardPercentage: 30,
        },
      }),
      logger: { error: vi.fn() },
    }

    await createReferralRewardForSettlement({
      paymentSettlement: {
        amount: 10_000,
        id: 'settlement-2',
        plan: 'monthly',
        revenue: 9_700,
        user: 'referred-1',
        verifiedAt: '2026-07-24T12:00:00.000Z',
      } as any,
      referredSubscription: { id: 'referred-subscription-1' } as any,
      req: { payload } as any,
      transaction: { id: 'transaction-2' } as any,
    })

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ineligibilityReason: 'referrer-subscription-inactive',
          rewardAmount: 0,
          status: 'ineligible',
        }),
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notifications',
        data: expect.objectContaining({
          actionLink: '/dashboard/subscriptions',
          message: expect.stringContaining('3,000 XAF referral bonus (30%)'),
          priority: 'high',
          recipient: 'referrer-1',
          title: 'Referral bonus missed',
          type: 'referral',
        }),
      }),
    )
  })

  it('reverses an earned reward without deleting its original amounts', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 'reward-1', rewardAmount: 3_000, status: 'available' }],
      }),
      update: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'reward-1',
        rewardAmount: 3_000,
        ...data,
      })),
    }

    const reward = await reverseReferralRewardForTransaction(
      { payload } as any,
      'transaction-1',
      'Subscription payment refunded',
    )

    expect(reward).toMatchObject({
      id: 'reward-1',
      reversalReason: 'Subscription payment refunded',
      rewardAmount: 3_000,
      status: 'reversed',
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'referral-rewards',
        id: 'reward-1',
        data: expect.objectContaining({ status: 'reversed' }),
      }),
    )
  })
})
