import { describe, expect, it, vi } from 'vitest'

import {
  getPreferredSubjectIds,
  getSubjectContentRecommendations,
} from '@/services/contentRecommendations'

describe('subject content recommendations', () => {
  it('normalizes and deduplicates populated and unpopulated subject relationships', () => {
    expect(
      getPreferredSubjectIds({
        subjects: ['mathematics', { id: 'physics' }, { id: 'mathematics' }] as any,
      }),
    ).toEqual(['mathematics', 'physics'])
  })

  it('queries videos and active books only within the student subjects and level', async () => {
    const user = {
      academicLevel: { id: 'form-5' },
      id: 'student-1',
      subjects: ['mathematics', { id: 'physics' }],
    } as any
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 'video-1', title: 'Vectors' }] })
      .mockResolvedValueOnce({ docs: [{ id: 'book-1', title: 'Mechanics' }] })

    const result = await getSubjectContentRecommendations({ find } as any, user)

    expect(result.preferredSubjectIds).toEqual(['mathematics', 'physics'])
    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'videos',
        depth: 1,
        limit: 3,
        overrideAccess: false,
        sort: '-createdAt',
        user,
        where: {
          and: [
            { subject: { in: ['mathematics', 'physics'] } },
            { academicLevel: { equals: 'form-5' } },
          ],
        },
      }),
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'books',
        overrideAccess: false,
        user,
        where: {
          and: [
            { subject: { in: ['mathematics', 'physics'] } },
            { academicLevel: { equals: 'form-5' } },
            { isActive: { not_equals: false } },
          ],
        },
      }),
    )
    expect(find.mock.calls[0][0].select).not.toHaveProperty('video')
    expect(find.mock.calls[1][0].select).not.toHaveProperty('pdf')
  })

  it('does not replace missing preferences with globally recent content', async () => {
    const find = vi.fn()

    await expect(
      getSubjectContentRecommendations(
        { find } as any,
        { academicLevel: 'form-5', id: 'student-1', subjects: [] } as any,
      ),
    ).resolves.toEqual({ books: [], preferredSubjectIds: [], videos: [] })
    expect(find).not.toHaveBeenCalled()
  })
})
