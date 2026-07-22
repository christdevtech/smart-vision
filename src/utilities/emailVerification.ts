import type { Payload } from 'payload'

type VerificationBackfillModel = {
  updateMany: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) => Promise<{ modifiedCount?: number }>
}

export async function backfillLegacyEmailVerification(payload: Payload): Promise<number> {
  const model = payload.db.collections.users as unknown as VerificationBackfillModel
  const result = await model.updateMany(
    { _verified: { $exists: false } },
    { $set: { _verified: true } },
  )

  return result.modifiedCount ?? 0
}
