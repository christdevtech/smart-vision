import {
  authorizePaymentOperator,
  getRetryAfterSeconds,
  getServerPlanAmount,
  hasValidCronAuthorization,
  isTrustedRequestOrigin,
  parsePaymentInitiationInput,
} from '@/utilities/paymentSecurity'
import { describe, expect, it, vi } from 'vitest'

describe('payment initiation trust boundary', () => {
  it('accepts only the client fields needed to select a plan and collect payment', () => {
    expect(
      parsePaymentInitiationInput({
        plan: 'annual',
        phone: '+237 677 123 456',
        medium: 'mobile money',
      }),
    ).toEqual({
      plan: 'annual',
      phone: '+237 677 123 456',
      medium: 'mobile money',
    })
  })

  it.each(['userId', 'amount', 'subscriptionId', 'name', 'email', 'message'])(
    'rejects the caller-controlled %s field',
    (field) => {
      expect(() =>
        parsePaymentInitiationInput({
          plan: 'monthly',
          phone: '677123456',
          [field]: field === 'amount' ? 100 : 'attacker-controlled',
        }),
      ).toThrow('controlled by the server')
    },
  )

  it('derives exact prices from server settings', () => {
    const costs = { monthly: 3000, yearly: 30000 }

    expect(getServerPlanAmount('monthly', costs)).toBe(3000)
    expect(getServerPlanAmount('annual', costs)).toBe(30000)
    expect(() => getServerPlanAmount('monthly', { monthly: 0, yearly: 30000 })).toThrow(
      'Invalid server price',
    )
  })

  it('rejects cross-origin browser requests', () => {
    expect(
      isTrustedRequestOrigin(
        'https://smartvisioncm.com/api/custom/payments/initiate',
        new Headers({ origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' }),
      ),
    ).toBe(false)

    expect(
      isTrustedRequestOrigin(
        'https://smartvisioncm.com/api/custom/payments/initiate',
        new Headers({ origin: 'https://smartvisioncm.com', 'sec-fetch-site': 'same-origin' }),
      ),
    ).toBe(true)
  })
})

describe('payment operator and polling controls', () => {
  it('fails closed when the cron secret is not configured', () => {
    expect(hasValidCronAuthorization('Bearer undefined', undefined)).toBe(false)
    expect(hasValidCronAuthorization('Bearer expected', 'expected')).toBe(true)
    expect(hasValidCronAuthorization('Bearer wrong', 'expected')).toBe(false)
  })

  it('allows only administrators or a valid cron bearer token', async () => {
    const adminPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } }),
    }
    const userPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'user' } }),
    }

    await expect(
      authorizePaymentOperator(adminPayload as any, new Headers(), 'cron-secret'),
    ).resolves.toMatchObject({ kind: 'admin' })
    await expect(
      authorizePaymentOperator(userPayload as any, new Headers(), 'cron-secret'),
    ).resolves.toBeNull()
    await expect(
      authorizePaymentOperator(
        userPayload as any,
        new Headers({ authorization: 'Bearer cron-secret' }),
        'cron-secret',
      ),
    ).resolves.toEqual({ kind: 'cron' })
  })

  it('calculates a bounded polling retry interval', () => {
    const now = Date.parse('2026-07-22T12:00:00.000Z')

    expect(getRetryAfterSeconds('2026-07-22T11:59:58.000Z', 4000, now)).toBe(2)
    expect(getRetryAfterSeconds('2026-07-22T11:59:55.000Z', 4000, now)).toBe(0)
    expect(getRetryAfterSeconds('not-a-date', 4000, now)).toBe(0)
  })
})
