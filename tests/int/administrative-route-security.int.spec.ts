import {
  authorizeAdministrativeRequest,
  canRunAdministrativeJob,
  CONTENT_ADMINISTRATIVE_ROLES,
  hasValidBearerAuthorization,
  isSeedRouteEnabled,
} from '@/utilities/requestAuthorization'
import { describe, expect, it, vi } from 'vitest'

describe('administrative request authorization', () => {
  it('fails closed when a bearer secret is absent or incorrect', () => {
    expect(hasValidBearerAuthorization('Bearer undefined', undefined)).toBe(false)
    expect(hasValidBearerAuthorization(null, 'expected')).toBe(false)
    expect(hasValidBearerAuthorization('Bearer wrong', 'expected')).toBe(false)
    expect(hasValidBearerAuthorization('Bearer expected', 'expected')).toBe(true)
  })

  it('allows only configured administrative roles for user sessions', async () => {
    const payloadFor = (role: string) => ({
      auth: vi.fn().mockResolvedValue({ user: { id: `${role}-1`, role } }),
    })

    await expect(
      authorizeAdministrativeRequest(payloadFor('content-manager') as any, new Headers(), {
        allowedRoles: CONTENT_ADMINISTRATIVE_ROLES,
      }),
    ).resolves.toMatchObject({ kind: 'user', user: { role: 'content-manager' } })

    await expect(
      authorizeAdministrativeRequest(payloadFor('user') as any, new Headers(), {
        allowedRoles: CONTENT_ADMINISTRATIVE_ROLES,
      }),
    ).resolves.toBeNull()
  })

  it('accepts a valid service bearer token without requiring a user session', async () => {
    const payload = { auth: vi.fn() }

    await expect(
      authorizeAdministrativeRequest(
        payload as any,
        new Headers({ authorization: 'Bearer cron-secret' }),
        { bearerSecret: 'cron-secret' },
      ),
    ).resolves.toEqual({ kind: 'service' })
    expect(payload.auth).not.toHaveBeenCalled()
  })

  it('disables HTTP seed routes in production', () => {
    expect(isSeedRouteEnabled('production')).toBe(false)
    expect(isSeedRouteEnabled('development')).toBe(true)
    expect(isSeedRouteEnabled('test')).toBe(true)
  })

  it('restricts background job execution to administrators or a configured secret', () => {
    expect(canRunAdministrativeJob({ role: 'user' }, null, undefined)).toBe(false)
    expect(canRunAdministrativeJob(null, 'Bearer undefined', undefined)).toBe(false)
    expect(canRunAdministrativeJob({ role: 'admin' }, null, undefined)).toBe(true)
    expect(canRunAdministrativeJob(null, 'Bearer expected', 'expected')).toBe(true)
  })
})
