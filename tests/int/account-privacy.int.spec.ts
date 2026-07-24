import { describe, expect, it, vi } from 'vitest'

import { ActivityLogs } from '@/collections/ActivityLogs'
import { Users } from '@/collections/Users'
import {
  anonymizeAccount,
  buildAccountPrivacyExport,
  processDueAccountDeletions,
  requestAccountDeletion,
  sanitizeAccountExport,
} from '@/services/accountPrivacy'

const getUserField = (name: string): any => {
  const field = Users.fields.find((candidate) => 'name' in candidate && candidate.name === name)
  if (!field) throw new Error(`Missing Users field: ${name}`)
  return field
}

describe('account privacy export', () => {
  it('recursively removes authentication and protected-delivery secrets', () => {
    expect(
      sanitizeAccountExport({
        email: 'student@example.com',
        password: 'hashed',
        sessions: [{ id: 'session-secret' }],
        nested: {
          accessToken: 'delivery-secret',
          encryptionKey: 'content-secret',
          sessionToken: 'access-session-secret',
          score: 80,
        },
      }),
    ).toEqual({
      email: 'student@example.com',
      nested: { score: 80 },
    })
  })

  it('exports owner-scoped records and includes both sides of referral history', async () => {
    const find = vi.fn(async ({ collection, where }: any) => ({
      docs:
        collection === 'referral-rewards'
          ? [{ id: 'reward-1', referrer: 'user-1', token: 'never-export' }]
          : [{ id: `${collection}-1`, ownerQuery: where }],
      hasNextPage: false,
    }))
    const payload = {
      find,
      findByID: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        sessions: [{ id: 'secret' }],
      }),
    } as any

    const exported = await buildAccountPrivacyExport(
      payload,
      'user-1',
      new Date('2026-07-24T12:00:00.000Z'),
    )

    expect(exported.exportedAt).toBe('2026-07-24T12:00:00.000Z')
    expect(exported.account).toEqual({ id: 'user-1', email: 'student@example.com' })
    expect(exported.records['referral-rewards']).toEqual([{ id: 'reward-1', referrer: 'user-1' }])
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'referral-attributions',
        where: {
          or: [{ referrer: { equals: 'user-1' } }, { referredUser: { equals: 'user-1' } }],
        },
      }),
    )
  })
})

describe('staged account deletion', () => {
  it('deactivates the account and schedules anonymization 30 days later', async () => {
    const update = vi.fn().mockResolvedValue({})
    const payload = { update } as any

    await expect(
      requestAccountDeletion(payload, 'user-1', new Date('2026-07-24T00:00:00.000Z')),
    ).resolves.toEqual({
      requestedAt: '2026-07-24T00:00:00.000Z',
      scheduledFor: '2026-08-23T00:00:00.000Z',
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({
          deletionStatus: 'requested',
          isActive: false,
        }),
        id: 'user-1',
        overrideAccess: true,
      }),
    )
  })

  it('removes volatile student data but preserves finance and audit relationships', async () => {
    const deleteOperation = vi.fn().mockResolvedValue({})
    const update = vi.fn().mockResolvedValue({})
    const payload = { delete: deleteOperation, update } as any

    await anonymizeAccount(payload, 'user-1', new Date('2026-08-23T00:00:00.000Z'))

    const deletedCollections = deleteOperation.mock.calls.map(([args]) => args.collection)
    expect(deletedCollections).toEqual(
      expect.arrayContaining([
        'content-access',
        'media',
        'notifications',
        'study-plans',
        'test-results',
        'test-sessions',
        'user-progress',
      ]),
    )
    expect(deletedCollections).not.toEqual(
      expect.arrayContaining(['activity-logs', 'payment-settlements', 'transactions']),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({
          dateOfBirth: null,
          deletionStatus: 'anonymized',
          email: expect.stringMatching(/^deleted\+[a-f0-9]+@smartvision\.invalid$/),
          firstName: 'Deleted',
          isActive: false,
          phoneNumber: null,
        }),
      }),
    )
  })

  it('processes only due requested accounts and reports per-account failures', async () => {
    const logger = { error: vi.fn() }
    const payload = {
      delete: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 'user-1' }, { id: 'user-2' }],
      }),
      logger,
      update: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('database unavailable')),
    } as any

    await expect(
      processDueAccountDeletions(payload, new Date('2026-08-23T00:00:00.000Z')),
    ).resolves.toEqual({ anonymized: 1, errors: 1 })
    expect(logger.error).toHaveBeenCalledOnce()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [
            { deletionStatus: { equals: 'requested' } },
            { deletionScheduledFor: { less_than_equal: '2026-08-23T00:00:00.000Z' } },
          ],
        },
      }),
    )
  })

  it('keeps deletion lifecycle fields server-managed and audit creation server-only', async () => {
    for (const fieldName of [
      'anonymizedAt',
      'deletionRequestedAt',
      'deletionScheduledFor',
      'deletionStatus',
    ]) {
      const field = getUserField(fieldName)
      expect(await field.access.create({ req: { user: null } })).toBe(false)
      expect(await field.access.update({ req: { user: { id: 'user-1', role: 'user' } } })).toBe(
        false,
      )
    }

    expect(await (ActivityLogs.access?.create as any)({ req: { user: { role: 'user' } } })).toBe(
      false,
    )
  })
})
