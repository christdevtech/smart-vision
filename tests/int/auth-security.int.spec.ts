import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Users } from '@/collections/Users'
import {
  enforceActiveUserBeforeLogin,
  enforceUserAuthOperation,
} from '@/collections/Users/hooks/authSecurity'
import { afterChangeUser } from '@/collections/Users/hooks/afterChangeUser'
import { consumeAuthRateLimit, resetAuthRateLimitsForTests } from '@/utilities/authRateLimit'
import { backfillLegacyEmailVerification } from '@/utilities/emailVerification'
import { getPasswordPolicyError, isPasswordPolicySatisfied } from '@/utilities/passwordPolicy'
import {
  listAccountSessions,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from '@/services/accountSessions'

describe('authentication policy', () => {
  beforeEach(() => resetAuthRateLimitsForTests())

  it('uses one strong password policy across authentication flows', () => {
    expect(isPasswordPolicySatisfied('short')).toBe(false)
    expect(isPasswordPolicySatisfied('Longbutnonumber!')).toBe(false)
    expect(isPasswordPolicySatisfied('Student2026!', 'student@example.com')).toBe(false)
    expect(getPasswordPolicyError('Saf3-Learning!')).toBeNull()
  })

  it('rejects weak passwords at the collection operation boundary', async () => {
    await expect(
      enforceUserAuthOperation({
        operation: 'create',
        args: { data: { email: 'learner@example.com', password: '123456' } },
        req: { headers: new Headers() },
      } as any),
    ).rejects.toMatchObject({ status: 400 })

    await expect(
      enforceUserAuthOperation({
        operation: 'resetPassword',
        args: { data: { password: 'Saf3-Learning!', token: 'token' } },
        req: { headers: new Headers() },
      } as any),
    ).resolves.toBeDefined()
  })

  it('applies IP-aware throttling without grouping trusted local API calls', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.8, 10.0.0.2' })
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(consumeAuthRateLimit({ headers, operation: 'login', now: 1_000 })).toMatchObject({
        allowed: true,
      })
    }
    expect(consumeAuthRateLimit({ headers, operation: 'login', now: 1_000 }).allowed).toBe(false)
    expect(
      consumeAuthRateLimit({ headers: new Headers(), operation: 'login', now: 1_000 }).allowed,
    ).toBe(true)
  })

  it('configures verification, lockout, secure cookies, and a 30-day session ceiling', () => {
    const auth = Users.auth
    expect(auth).not.toBe(true)
    expect(auth).toMatchObject({
      lockTime: 15 * 60 * 1000,
      maxLoginAttempts: 5,
      removeTokenFromResponses: true,
      tokenExpiration: 30 * 24 * 60 * 60,
      useSessions: true,
      cookies: { sameSite: 'Lax' },
    })
    expect(typeof (auth as NonNullable<Exclude<typeof auth, boolean>>).verify).toBe('object')
  })

  it('rejects login for a deactivated account', () => {
    expect(() => enforceActiveUserBeforeLogin({ user: { isActive: false } } as any)).toThrow(
      'deactivated',
    )
    expect(() => enforceActiveUserBeforeLogin({ user: { isActive: true } } as any)).not.toThrow()
  })
})

describe('session lifecycle', () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()

  it('lists only active sessions and identifies the current one', async () => {
    const lean = vi.fn().mockResolvedValue({
      sessions: [
        { id: 'current', createdAt: '2026-07-20T00:00:00.000Z', expiresAt: future },
        { id: 'expired', createdAt: '2026-07-19T00:00:00.000Z', expiresAt: past },
      ],
    })
    const payload = { db: { collections: { users: { findOne: () => ({ lean }) } } } } as any

    await expect(listAccountSessions(payload, 'user-1', 'current')).resolves.toEqual([
      {
        id: 'current',
        current: true,
        createdAt: '2026-07-20T00:00:00.000Z',
        expiresAt: future,
      },
    ])
  })

  it('never revokes the current session through the session-management endpoint', async () => {
    const updateOne = vi.fn()
    const payload = { db: { collections: { users: { updateOne } } } } as any
    await expect(revokeAccountSession(payload, 'user-1', 'current', 'current')).resolves.toBe(false)
    expect(updateOne).not.toHaveBeenCalled()
  })

  it('can retain only the current session', async () => {
    const updateOne = vi.fn()
    const lean = vi.fn().mockResolvedValue({
      sessions: [
        { id: 'current', createdAt: '2026-07-20T00:00:00.000Z', expiresAt: future },
        { id: 'other', createdAt: '2026-07-19T00:00:00.000Z', expiresAt: future },
      ],
    })
    const payload = {
      db: { collections: { users: { findOne: () => ({ lean }), updateOne } } },
    } as any

    await expect(revokeOtherAccountSessions(payload, 'user-1', 'current')).resolves.toBe(1)
    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'user-1' },
      {
        $set: {
          sessions: [{ id: 'current', createdAt: '2026-07-20T00:00:00.000Z', expiresAt: future }],
        },
      },
    )
  })

  it('revokes every stored session when an account is deactivated', async () => {
    const updateOne = vi.fn()
    await afterChangeUser({
      doc: { id: 'user-1', isActive: false },
      operation: 'update',
      previousDoc: { isActive: true },
      req: { payload: { db: { updateOne }, logger: { error: vi.fn() } } },
    } as any)

    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 'user-1', data: { sessions: [] } }),
    )
  })
})

describe('email verification migration', () => {
  it('marks only legacy records without a verification state as verified', async () => {
    const updateMany = vi.fn().mockResolvedValue({ modifiedCount: 7 })
    const payload = { db: { collections: { users: { updateMany } } } } as any

    await expect(backfillLegacyEmailVerification(payload)).resolves.toBe(7)
    expect(updateMany).toHaveBeenCalledWith(
      { _verified: { $exists: false } },
      { $set: { _verified: true } },
    )
  })
})
