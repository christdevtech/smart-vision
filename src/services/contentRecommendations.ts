import type { Book, User, Video } from '@/payload-types'
import type { Payload, Where } from 'payload'

export type RecommendedBook = Pick<
  Book,
  'academicLevel' | 'author' | 'createdAt' | 'id' | 'slug' | 'subject' | 'title'
>

export type RecommendedVideo = Pick<
  Video,
  'academicLevel' | 'createdAt' | 'id' | 'slug' | 'subject' | 'title'
>

export type SubjectContentRecommendations = {
  books: RecommendedBook[]
  preferredSubjectIds: string[]
  videos: RecommendedVideo[]
}

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

export function getPreferredSubjectIds(user: Pick<User, 'subjects'>): string[] {
  return Array.from(
    new Set((user.subjects ?? []).map((subject) => relationshipId(subject)).filter(Boolean)),
  ) as string[]
}

export async function getSubjectContentRecommendations(
  payload: Payload,
  user: User,
  limit = 3,
): Promise<SubjectContentRecommendations> {
  const preferredSubjectIds = getPreferredSubjectIds(user)
  if (preferredSubjectIds.length === 0) {
    return { books: [], preferredSubjectIds, videos: [] }
  }

  const filters: Where[] = [{ subject: { in: preferredSubjectIds } }]
  const academicLevelId = relationshipId(user.academicLevel)
  if (academicLevelId) filters.push({ academicLevel: { equals: academicLevelId } })

  const access = {
    depth: 1,
    limit,
    overrideAccess: false as const,
    sort: '-createdAt',
    user,
  }

  const [videosResult, booksResult] = await Promise.all([
    payload.find({
      ...access,
      collection: 'videos',
      select: {
        academicLevel: true,
        createdAt: true,
        slug: true,
        subject: true,
        title: true,
      },
      where: { and: filters },
    }),
    payload.find({
      ...access,
      collection: 'books',
      select: {
        academicLevel: true,
        author: true,
        createdAt: true,
        slug: true,
        subject: true,
        title: true,
      },
      where: {
        and: [...filters, { isActive: { not_equals: false } }],
      },
    }),
  ])

  return {
    books: booksResult.docs as RecommendedBook[],
    preferredSubjectIds,
    videos: videosResult.docs as RecommendedVideo[],
  }
}
