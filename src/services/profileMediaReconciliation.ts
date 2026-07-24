import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Media, User } from '@/payload-types'
import { getR2StorageSettings, R2_MEDIA_PREFIX, type R2StorageSettings } from '@/plugins/r2Storage'
import type { Payload } from 'payload'

export type ProfileMediaIssueReason =
  | 'explicit-metadata-mismatch'
  | 'invalid-reference'
  | 'missing-filename'
  | 'missing-media-record'
  | 'missing-r2-object'
  | 'shared-reference'

export type ProfileMediaIssue = {
  mediaId?: string
  reason: ProfileMediaIssueReason
  userId: string
}

export type ProfileMediaReconciliationReport = {
  checked: number
  explicitMetadataMismatches: number
  invalidReferences: number
  metadataBackfillEligible: number
  metadataUpdated: number
  missingFilenames: number
  missingMediaRecords: number
  missingR2Objects: number
  r2ObjectsPresent: number
  sharedReferences: number
  totalProfileReferences: number
  truncated: boolean
  issues: ProfileMediaIssue[]
}

export interface ProfileObjectStore {
  close?(): void
  exists(filename: string): Promise<boolean>
}

const relationshipId = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

const isMissingObjectError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  const metadata =
    '$metadata' in error && error.$metadata && typeof error.$metadata === 'object'
      ? (error.$metadata as { httpStatusCode?: number })
      : undefined

  return (
    metadata?.httpStatusCode === 404 ||
    name === 'NotFound' ||
    name === 'NoSuchKey' ||
    name === 'NoSuchObject'
  )
}

export function createProfileObjectStore(
  settings: R2StorageSettings = getR2StorageSettings(),
): ProfileObjectStore {
  if (!settings.configured) {
    throw new Error('Cloudflare R2 storage must be configured before reconciling profile media')
  }

  const client = new S3Client({
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    endpoint: settings.endpoint,
    forcePathStyle: true,
    region: settings.region,
  })

  return {
    close: () => client.destroy(),
    async exists(filename: string) {
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: settings.bucket,
            Key: `${R2_MEDIA_PREFIX}/${filename}`,
          }),
        )
        return true
      } catch (error) {
        if (isMissingObjectError(error)) return false
        throw error
      }
    },
  }
}

export async function reconcileProfileMedia(
  payload: Payload,
  {
    applyMetadata = false,
    limit = 100,
    objectStore,
  }: {
    applyMetadata?: boolean
    limit?: number
    objectStore?: ProfileObjectStore
  } = {},
): Promise<ProfileMediaReconciliationReport> {
  const resolvedObjectStore = objectStore ?? createProfileObjectStore()
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 500)
  try {
    const users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: boundedLimit,
      overrideAccess: true,
      select: {
        id: true,
        profilePic: true,
      },
      where: {
        profilePic: { exists: true },
      },
    })

    const references = users.docs
      .map((user) => ({
        mediaId: relationshipId((user as User).profilePic),
        userId: String(user.id),
      }))
      .filter((reference) => reference.mediaId)
    const referenceCounts = new Map<string, number>()
    for (const { mediaId } of references) {
      referenceCounts.set(mediaId!, (referenceCounts.get(mediaId!) ?? 0) + 1)
    }

    const report: ProfileMediaReconciliationReport = {
      checked: users.docs.length,
      explicitMetadataMismatches: 0,
      invalidReferences: users.docs.length - references.length,
      issues: users.docs
        .filter((user) => !relationshipId((user as User).profilePic))
        .map((user) => ({ reason: 'invalid-reference', userId: String(user.id) })),
      metadataBackfillEligible: 0,
      metadataUpdated: 0,
      missingFilenames: 0,
      missingMediaRecords: 0,
      missingR2Objects: 0,
      r2ObjectsPresent: 0,
      sharedReferences: 0,
      totalProfileReferences: users.totalDocs,
      truncated: users.hasNextPage,
    }

    for (const { mediaId, userId } of references) {
      let media: Media
      try {
        media = await payload.findByID({
          collection: 'media',
          depth: 0,
          id: mediaId!,
          overrideAccess: true,
        })
      } catch (error) {
        const status =
          error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined
        if (status !== 404) throw error

        report.missingMediaRecords += 1
        report.issues.push({ mediaId: mediaId!, reason: 'missing-media-record', userId })
        continue
      }

      if (!media.filename) {
        report.missingFilenames += 1
        report.issues.push({ mediaId: mediaId!, reason: 'missing-filename', userId })
        continue
      }

      const objectExists = await resolvedObjectStore.exists(media.filename)
      if (!objectExists) {
        report.missingR2Objects += 1
        report.issues.push({ mediaId: mediaId!, reason: 'missing-r2-object', userId })
        continue
      }
      report.r2ObjectsPresent += 1

      const sharedReference = (referenceCounts.get(mediaId!) ?? 0) > 1
      if (sharedReference) {
        report.sharedReferences += 1
        report.issues.push({ mediaId: mediaId!, reason: 'shared-reference', userId })
        continue
      }

      const ownerId = relationshipId(media.owner)
      const hasLegacyMetadata = !media.accessScope && !ownerId
      if (hasLegacyMetadata) {
        report.metadataBackfillEligible += 1
        if (applyMetadata) {
          await payload.update({
            collection: 'media',
            context: { profileMediaReconciliation: true },
            data: {
              accessScope: 'owner',
              owner: userId,
            },
            id: media.id,
            overrideAccess: true,
          })
          report.metadataUpdated += 1
        }
        continue
      }

      if (media.accessScope !== 'owner' || ownerId !== userId) {
        report.explicitMetadataMismatches += 1
        report.issues.push({
          mediaId: mediaId!,
          reason: 'explicit-metadata-mismatch',
          userId,
        })
      }
    }

    return report
  } finally {
    if (!objectStore) resolvedObjectStore.close?.()
  }
}
