import { describe, expect, it, vi } from 'vitest'

import { Users } from '@/collections/Users'
import {
  reconcileProfileMedia,
  type ProfileObjectStore,
} from '@/services/profileMediaReconciliation'

const userResult = {
  docs: [
    { id: 'user-present', profilePic: 'media-present' },
    { id: 'user-missing', profilePic: 'media-missing' },
  ],
  hasNextPage: false,
  totalDocs: 2,
}

describe('profile media delivery resilience', () => {
  it('populates one relationship level in authenticated user responses', () => {
    const auth = Users.auth
    expect(auth).not.toBe(true)
    expect(auth && typeof auth === 'object' ? auth.depth : undefined).toBe(1)
  })

  it('reports missing R2 objects without mutating legacy metadata during a dry run', async () => {
    const update = vi.fn()
    const payload = {
      find: vi.fn().mockResolvedValue(userResult),
      findByID: vi.fn(async ({ id }: { id: string }) => ({
        accessScope: null,
        filename: id === 'media-present' ? 'present.png' : 'missing.png',
        id,
        owner: null,
      })),
      update,
    } as any
    const objectStore: ProfileObjectStore = {
      exists: vi.fn(async (filename) => filename === 'present.png'),
    }

    await expect(reconcileProfileMedia(payload, { objectStore })).resolves.toMatchObject({
      checked: 2,
      metadataBackfillEligible: 1,
      metadataUpdated: 0,
      missingR2Objects: 1,
      r2ObjectsPresent: 1,
    })
    expect(update).not.toHaveBeenCalled()
  })

  it('backfills only unambiguous legacy metadata for objects that exist', async () => {
    const update = vi.fn().mockResolvedValue({})
    const payload = {
      find: vi.fn().mockResolvedValue(userResult),
      findByID: vi.fn(async ({ id }: { id: string }) => ({
        accessScope: null,
        filename: id === 'media-present' ? 'present.png' : 'missing.png',
        id,
        owner: null,
      })),
      update,
    } as any
    const objectStore: ProfileObjectStore = {
      exists: vi.fn(async (filename) => filename === 'present.png'),
    }

    const result = await reconcileProfileMedia(payload, {
      applyMetadata: true,
      objectStore,
    })

    expect(result.metadataUpdated).toBe(1)
    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith({
      collection: 'media',
      context: { profileMediaReconciliation: true },
      data: {
        accessScope: 'owner',
        owner: 'user-present',
      },
      id: 'media-present',
      overrideAccess: true,
    })
  })

  it('does not overwrite explicit media classifications', async () => {
    const update = vi.fn()
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 'user-1', profilePic: 'media-1' }],
        hasNextPage: false,
        totalDocs: 1,
      }),
      findByID: vi.fn().mockResolvedValue({
        accessScope: 'public',
        filename: 'profile.png',
        id: 'media-1',
        owner: null,
      }),
      update,
    } as any

    await expect(
      reconcileProfileMedia(payload, {
        applyMetadata: true,
        objectStore: { exists: vi.fn().mockResolvedValue(true) },
      }),
    ).resolves.toMatchObject({
      explicitMetadataMismatches: 1,
      metadataUpdated: 0,
    })
    expect(update).not.toHaveBeenCalled()
  })
})
