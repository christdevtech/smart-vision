import { UserProgress } from '@/collections/UserProgress'
import {
  PROGRESS_HEARTBEAT_COOLDOWN_MS,
  PROGRESS_HEARTBEAT_MINUTES,
  parseProgressHeartbeatInput,
  recordProgressHeartbeat,
} from '@/services/progressHeartbeat'
import { describe, expect, it, vi } from 'vitest'

const accessArgs = (user: Record<string, unknown> | null) => ({ req: { user } }) as any

describe('progress heartbeat trust boundary', () => {
  it('accepts only content identity and an idempotency key', () => {
    expect(
      parseProgressHeartbeatInput({
        contentId: 'video-1',
        contentType: 'video',
        heartbeatId: 'heartbeat-1234',
      }),
    ).toEqual({
      contentId: 'video-1',
      contentType: 'video',
      heartbeatId: 'heartbeat-1234',
    })
  })

  it.each(['user', 'subject', 'timeSpent', 'lastAccessed', 'progressPercentage'])(
    'rejects the caller-controlled %s field',
    (field) => {
      expect(() =>
        parseProgressHeartbeatInput({
          contentId: 'book-1',
          contentType: 'book',
          heartbeatId: 'heartbeat-1234',
          [field]: field === 'timeSpent' ? 10_000 : 'attacker-controlled',
        }),
      ).toThrow('controlled by the server')
    },
  )

  it('prevents ordinary clients from writing progress through the Payload API', async () => {
    const user = accessArgs({ id: 'user-1', role: 'user' })
    const admin = accessArgs({ id: 'admin-1', role: 'admin' })

    expect(await UserProgress.access?.create?.(user)).toBe(false)
    expect(await UserProgress.access?.update?.(user)).toBe(false)
    expect(await UserProgress.access?.create?.(admin)).toBe(true)
  })

  it('atomically applies a fixed server-owned increment and cooldown', async () => {
    const now = new Date('2026-07-22T12:00:00.000Z')
    const findOneAndUpdate = vi.fn().mockResolvedValue({
      lastAccessed: now,
      timeSpent: 3.5,
    })
    const payload = {
      db: { collections: { 'user-progress': { findOneAndUpdate } } },
    }

    await expect(
      recordProgressHeartbeat({
        input: {
          contentId: 'video-1',
          contentType: 'video',
          heartbeatId: 'heartbeat-1234',
        },
        metadata: { subject: 'subject-1' },
        now,
        payload: payload as any,
        userId: 'user-1',
      }),
    ).resolves.toEqual({
      accepted: true,
      lastAccessed: now.toISOString(),
      timeSpent: 3.5,
    })

    const [filter, update, options] = findOneAndUpdate.mock.calls[0]
    expect(filter).toMatchObject({
      user: 'user-1',
      contentType: 'video',
      contentId: 'video-1',
      'recentHeartbeatIds.heartbeatId': { $ne: 'heartbeat-1234' },
    })
    expect(filter.$or[1].lastHeartbeatAt.$lte).toEqual(
      new Date(now.getTime() - PROGRESS_HEARTBEAT_COOLDOWN_MS),
    )
    expect(update.$inc.timeSpent).toBe(PROGRESS_HEARTBEAT_MINUTES)
    expect(update.$set.user).toBeUndefined()
    expect(options).toMatchObject({ new: true, upsert: true })
  })

  it('treats concurrent or retried heartbeats as successful no-ops', async () => {
    const now = new Date('2026-07-22T12:00:00.000Z')
    const model = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ lastAccessed: now, timeSpent: 2 }),
      }),
      findOneAndUpdate: vi.fn().mockRejectedValue({ code: 11000 }),
    }
    const payload = { db: { collections: { 'user-progress': model } } }

    await expect(
      recordProgressHeartbeat({
        input: {
          contentId: 'book-1',
          contentType: 'book',
          heartbeatId: 'heartbeat-1234',
        },
        metadata: {},
        now,
        payload: payload as any,
        userId: 'user-1',
      }),
    ).resolves.toEqual({
      accepted: false,
      lastAccessed: now.toISOString(),
      timeSpent: 2,
    })
  })
})
