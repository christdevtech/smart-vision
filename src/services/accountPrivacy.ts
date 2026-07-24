import { createHash, randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

const DELETION_GRACE_DAYS = 30
const EXPORT_PAGE_SIZE = 500
const MAX_EXPORT_RECORDS_PER_SECTION = 10_000

const VOLATILE_USER_COLLECTIONS = [
  { collection: 'study-plans', ownerField: 'user' },
  { collection: 'user-progress', ownerField: 'user' },
  { collection: 'test-sessions', ownerField: 'user' },
  { collection: 'test-results', ownerField: 'user' },
  { collection: 'content-access', ownerField: 'user' },
  { collection: 'notifications', ownerField: 'recipient' },
] as const

const EXPORT_COLLECTIONS = [
  { collection: 'subscriptions', ownerField: 'user' },
  { collection: 'transactions', ownerField: 'user' },
  { collection: 'payment-settlements', ownerField: 'user' },
  { collection: 'study-plans', ownerField: 'user' },
  { collection: 'user-progress', ownerField: 'user' },
  { collection: 'test-sessions', ownerField: 'user' },
  { collection: 'test-results', ownerField: 'user' },
  { collection: 'content-access', ownerField: 'user' },
  { collection: 'notifications', ownerField: 'recipient' },
] as const

const PRIVATE_EXPORT_KEYS = new Set([
  '_verificationToken',
  'accessToken',
  'encryptionKey',
  'hash',
  'password',
  'resetPasswordExpiration',
  'resetPasswordToken',
  'salt',
  'sessionToken',
  'sessions',
  'token',
])

export type AccountDeletionRequest = {
  requestedAt: string
  scheduledFor: string
}

export type AccountPrivacyExport = {
  account: Record<string, unknown>
  exportedAt: string
  formatVersion: 1
  records: Record<string, unknown[]>
}

function anonymizedIdentity(userId: string) {
  const digest = createHash('sha256').update(userId).digest('hex').slice(0, 24)
  return {
    email: `deleted+${digest}@smartvision.invalid`,
    referralCode: `deleted-${digest}`,
  }
}

export function sanitizeAccountExport(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAccountExport)

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !PRIVATE_EXPORT_KEYS.has(key))
        .map(([key, item]) => [key, sanitizeAccountExport(item)]),
    )
  }

  return value
}

async function findAllOwnedRecords(
  payload: Payload,
  collection: string,
  ownerField: string,
  userId: string,
): Promise<unknown[]> {
  const records: unknown[] = []
  let page = 1

  while (records.length < MAX_EXPORT_RECORDS_PER_SECTION) {
    const result = await payload.find({
      collection: collection as never,
      depth: 0,
      limit: EXPORT_PAGE_SIZE,
      overrideAccess: true,
      page,
      where: { [ownerField]: { equals: userId } },
    } as never)

    records.push(...result.docs)
    if (!result.hasNextPage) break
    page += 1
  }

  return records.slice(0, MAX_EXPORT_RECORDS_PER_SECTION)
}

async function findReferralRecords(payload: Payload, collection: string, userId: string) {
  const result = await payload.find({
    collection: collection as never,
    depth: 0,
    limit: MAX_EXPORT_RECORDS_PER_SECTION,
    overrideAccess: true,
    where: {
      or: [{ referrer: { equals: userId } }, { referredUser: { equals: userId } }],
    },
  } as never)

  return result.docs
}

export async function buildAccountPrivacyExport(
  payload: Payload,
  userId: string,
  now = new Date(),
): Promise<AccountPrivacyExport> {
  const account = await payload.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
    overrideAccess: true,
  })

  const ownedSections = await Promise.all(
    EXPORT_COLLECTIONS.map(async ({ collection, ownerField }) => [
      collection,
      await findAllOwnedRecords(payload, collection, ownerField, userId),
    ]),
  )

  const [referralAttributions, referralRewards, activityLogs] = await Promise.all([
    findReferralRecords(payload, 'referral-attributions', userId),
    findReferralRecords(payload, 'referral-rewards', userId),
    findAllOwnedRecords(payload, 'activity-logs', 'user', userId),
  ])

  return sanitizeAccountExport({
    account,
    exportedAt: now.toISOString(),
    formatVersion: 1,
    records: {
      ...Object.fromEntries(ownedSections),
      'activity-logs': activityLogs,
      'referral-attributions': referralAttributions,
      'referral-rewards': referralRewards,
    },
  }) as AccountPrivacyExport
}

export async function requestAccountDeletion(
  payload: Payload,
  userId: string,
  now = new Date(),
): Promise<AccountDeletionRequest> {
  const requestedAt = now.toISOString()
  const scheduledFor = new Date(
    now.getTime() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  await payload.update({
    collection: 'users',
    context: { accountDeletionRequest: true },
    data: {
      deletionRequestedAt: requestedAt,
      deletionScheduledFor: scheduledFor,
      deletionStatus: 'requested',
      isActive: false,
    },
    id: userId,
    overrideAccess: true,
  })

  return { requestedAt, scheduledFor }
}

export async function anonymizeAccount(
  payload: Payload,
  userId: string,
  now = new Date(),
): Promise<void> {
  for (const { collection, ownerField } of VOLATILE_USER_COLLECTIONS) {
    await payload.delete({
      collection: collection as never,
      overrideAccess: true,
      where: { [ownerField]: { equals: userId } },
    } as never)
  }

  await payload.delete({
    collection: 'media',
    overrideAccess: true,
    where: {
      and: [{ owner: { equals: userId } }, { accessScope: { equals: 'owner' } }],
    },
  })

  const identity = anonymizedIdentity(userId)
  await payload.update({
    collection: 'users',
    context: { accountAnonymization: true },
    data: {
      academicLevel: null,
      anonymizedAt: now.toISOString(),
      dateOfBirth: null,
      deletionStatus: 'anonymized',
      email: identity.email,
      firstName: 'Deleted',
      isActive: false,
      lastActiveAt: null,
      lastName: 'Student',
      onboarded: false,
      password: `D3leted-${randomUUID()}!`,
      phoneNumber: null,
      profilePic: null,
      referralCode: identity.referralCode,
      referredBy: null,
      subjects: [],
      totalReferrals: 0,
    },
    id: userId,
    overrideAccess: true,
  })
}

export async function processDueAccountDeletions(
  payload: Payload,
  now = new Date(),
  limit = 50,
): Promise<{ anonymized: number; errors: number }> {
  const due = await payload.find({
    collection: 'users',
    depth: 0,
    limit: Math.min(Math.max(limit, 1), 100),
    overrideAccess: true,
    where: {
      and: [
        { deletionStatus: { equals: 'requested' } },
        { deletionScheduledFor: { less_than_equal: now.toISOString() } },
      ],
    },
  })

  let anonymized = 0
  let errors = 0

  for (const user of due.docs) {
    try {
      await anonymizeAccount(payload, user.id, now)
      anonymized += 1
    } catch (error) {
      errors += 1
      payload.logger.error({
        err: error instanceof Error ? error : new Error(String(error)),
        msg: `Could not anonymize scheduled account ${user.id}`,
      })
    }
  }

  return { anonymized, errors }
}
