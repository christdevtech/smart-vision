import { readMedia } from '@/access/mediaAccess'
import {
  createMediaDeliveryToken,
  MEDIA_DELIVERY_TTL_SECONDS,
  verifyMediaDeliveryToken,
} from '@/utilities/mediaDelivery'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const originalSecret = process.env.PAYLOAD_SECRET
const now = Date.parse('2026-07-22T12:00:00.000Z')
const claims = {
  contentId: 'video-1',
  contentType: 'video' as const,
  field: 'video' as const,
  filename: 'lesson.mp4',
  mediaId: 'media-1',
  userId: 'user-1',
}

describe('protected media delivery tokens', () => {
  beforeEach(() => {
    process.env.PAYLOAD_SECRET = 'test-signing-secret'
  })

  afterEach(() => {
    process.env.PAYLOAD_SECRET = originalSecret
  })

  it('binds a short-lived grant to the user, media, and filename', () => {
    const token = createMediaDeliveryToken({ ...claims, now })

    expect(
      verifyMediaDeliveryToken(
        token,
        { filename: claims.filename, mediaId: claims.mediaId, userId: claims.userId },
        now,
      ),
    ).toMatchObject(claims)
    expect(verifyMediaDeliveryToken(token, { userId: 'another-user' }, now)).toBeNull()
    expect(verifyMediaDeliveryToken(token, { filename: 'another-file.mp4' }, now)).toBeNull()
  })

  it('rejects tampered and expired grants', () => {
    const token = createMediaDeliveryToken({ ...claims, now })
    const [payload, signature] = token.split('.')

    expect(verifyMediaDeliveryToken(`${payload}x.${signature}`, {}, now)).toBeNull()
    expect(
      verifyMediaDeliveryToken(token, {}, now + (MEDIA_DELIVERY_TTL_SECONDS + 1) * 1000),
    ).toBeNull()
  })

  it('allows the matching signed file request but not a copied token for another file', () => {
    const token = createMediaDeliveryToken({ ...claims, now: Date.now() })
    const baseRequest = {
      query: { delivery: token },
      user: { id: claims.userId, role: 'user' },
    }

    expect(
      readMedia({
        req: { ...baseRequest, pathname: `/api/media/file/${claims.filename}` },
      } as never),
    ).toBe(true)
    expect(
      readMedia({
        req: { ...baseRequest, pathname: '/api/media/file/another-file.mp4' },
      } as never),
    ).not.toBe(true)
  })

  it('limits ordinary reads to public or owned media', () => {
    const result = readMedia({
      req: { query: {}, user: { id: 'user-1', role: 'user' } },
    } as never)

    expect(result).toEqual({
      or: [
        { accessScope: { equals: 'public' } },
        {
          and: [
            { accessScope: { exists: false } },
            { mimeType: { contains: 'image/' } },
          ],
        },
        {
          and: [
            { accessScope: { equals: 'owner' } },
            { owner: { equals: 'user-1' } },
          ],
        },
      ],
    })
  })
})
