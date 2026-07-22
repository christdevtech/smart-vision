import type { Payload } from 'payload'

export type AccountSession = {
  createdAt: string | null
  current: boolean
  expiresAt: string
  id: string
}

type StoredSession = {
  createdAt?: Date | string | null
  expiresAt: Date | string
  id: string
}

type UserSessionModel = {
  findOne: (filter: Record<string, unknown>) => {
    lean: () => Promise<{ sessions?: StoredSession[] | null } | null>
  }
  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<unknown>
}

function getUserModel(payload: Payload): UserSessionModel {
  return payload.db.collections.users as unknown as UserSessionModel
}

export async function listAccountSessions(
  payload: Payload,
  userId: string,
  currentSessionId?: string,
  now = Date.now(),
): Promise<AccountSession[]> {
  const user = await getUserModel(payload).findOne({ _id: userId }).lean()

  return (user?.sessions ?? [])
    .filter((session) => new Date(session.expiresAt).getTime() > now)
    .map((session) => ({
      createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
      current: session.id === currentSessionId,
      expiresAt: new Date(session.expiresAt).toISOString(),
      id: session.id,
    }))
    .sort((left, right) => {
      if (left.current !== right.current) return left.current ? -1 : 1
      return (right.createdAt ?? '').localeCompare(left.createdAt ?? '')
    })
}

export async function revokeAccountSession(
  payload: Payload,
  userId: string,
  sessionId: string,
  currentSessionId?: string,
): Promise<boolean> {
  if (!sessionId || sessionId === currentSessionId) return false

  await getUserModel(payload).updateOne({ _id: userId }, { $pull: { sessions: { id: sessionId } } })
  return true
}

export async function revokeOtherAccountSessions(
  payload: Payload,
  userId: string,
  currentSessionId?: string,
): Promise<number> {
  const sessions = await listAccountSessions(payload, userId, currentSessionId)
  const retained = sessions.filter((session) => session.current)

  await getUserModel(payload).updateOne(
    { _id: userId },
    {
      $set: {
        sessions: retained.map(({ createdAt, expiresAt, id }) => ({ createdAt, expiresAt, id })),
      },
    },
  )

  return sessions.length - retained.length
}
