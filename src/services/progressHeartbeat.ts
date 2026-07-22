import type { Payload } from 'payload'

export const PROGRESS_HEARTBEAT_INTERVAL_MS = 30_000
export const PROGRESS_HEARTBEAT_COOLDOWN_MS = 25_000
export const PROGRESS_HEARTBEAT_MINUTES = PROGRESS_HEARTBEAT_INTERVAL_MS / 60_000
export const PROGRESS_HEARTBEAT_HISTORY_LIMIT = 20

export type ProgressContentType = 'book' | 'video'

export interface ProgressHeartbeatInput {
  contentId: string
  contentType: ProgressContentType
  heartbeatId: string
}

export interface ProgressContentMetadata {
  academicLevel?: string
  subject?: string
  topic?: string[]
}

export interface ProgressHeartbeatResult {
  accepted: boolean
  lastAccessed: string | null
  timeSpent: number
}

const ALLOWED_FIELDS = new Set(['contentId', 'contentType', 'heartbeatId'])
const HEARTBEAT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/

export function parseProgressHeartbeatInput(body: unknown): ProgressHeartbeatInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid progress heartbeat')
  }

  const input = body as Record<string, unknown>
  const unknownField = Object.keys(input).find((field) => !ALLOWED_FIELDS.has(field))
  if (unknownField) {
    throw new Error(`The ${unknownField} field is controlled by the server`)
  }

  if (input.contentType !== 'book' && input.contentType !== 'video') {
    throw new Error('Content type must be book or video')
  }

  if (
    typeof input.contentId !== 'string' ||
    input.contentId.length < 1 ||
    input.contentId.length > 128
  ) {
    throw new Error('Invalid content ID')
  }

  if (
    typeof input.heartbeatId !== 'string' ||
    !HEARTBEAT_ID_PATTERN.test(input.heartbeatId)
  ) {
    throw new Error('Invalid heartbeat ID')
  }

  return {
    contentId: input.contentId,
    contentType: input.contentType,
    heartbeatId: input.heartbeatId,
  }
}

export function relationshipId(
  value: string | { id?: string | null } | null | undefined,
): string | undefined {
  if (typeof value === 'string') return value
  return value?.id || undefined
}

export function relationshipIds(
  values: (string | { id?: string | null })[] | null | undefined,
): string[] | undefined {
  const ids = values?.map(relationshipId).filter((id): id is string => Boolean(id))
  return ids?.length ? ids : undefined
}

export function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000,
  )
}

export async function recordProgressHeartbeat({
  input,
  metadata,
  now = new Date(),
  payload,
  userId,
}: {
  input: ProgressHeartbeatInput
  metadata: ProgressContentMetadata
  now?: Date
  payload: Payload
  userId: string
}): Promise<ProgressHeartbeatResult> {
  const model = payload.db.collections['user-progress']
  const identity = {
    user: userId,
    contentType: input.contentType,
    contentId: input.contentId,
  }
  const cutoff = new Date(now.getTime() - PROGRESS_HEARTBEAT_COOLDOWN_MS)

  try {
    const progress = await model.findOneAndUpdate(
      {
        ...identity,
        'recentHeartbeatIds.heartbeatId': { $ne: input.heartbeatId },
        $or: [
          { lastHeartbeatAt: { $exists: false } },
          { lastHeartbeatAt: { $lte: cutoff } },
        ],
      },
      {
        $inc: { timeSpent: PROGRESS_HEARTBEAT_MINUTES },
        $push: {
          recentHeartbeatIds: {
            $each: [{ heartbeatId: input.heartbeatId, receivedAt: now }],
            $slice: -PROGRESS_HEARTBEAT_HISTORY_LIMIT,
          },
        },
        $set: {
          lastAccessed: now,
          lastHeartbeatAt: now,
          ...(metadata.academicLevel ? { academicLevel: metadata.academicLevel } : {}),
          ...(metadata.subject ? { subject: metadata.subject } : {}),
          ...(metadata.topic ? { topic: metadata.topic } : {}),
        },
        $setOnInsert: {
          ...identity,
          attempts: 1,
          completed: false,
          progressPercentage: 0,
          studyStreak: 0,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    )

    return {
      accepted: true,
      lastAccessed:
        progress?.lastAccessed instanceof Date
          ? progress.lastAccessed.toISOString()
          : progress?.lastAccessed?.toString?.() ?? now.toISOString(),
      timeSpent: Number(progress?.timeSpent ?? PROGRESS_HEARTBEAT_MINUTES),
    }
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error

    const progress = (await model.findOne(identity).lean()) as {
      lastAccessed?: Date | string | null
      timeSpent?: number | null
    } | null
    return {
      accepted: false,
      lastAccessed:
        progress?.lastAccessed instanceof Date
          ? progress.lastAccessed.toISOString()
          : progress?.lastAccessed?.toString?.() ?? null,
      timeSpent: Number(progress?.timeSpent ?? 0),
    }
  }
}
