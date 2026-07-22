import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import {
  listAccountSessions,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from '@/services/accountSessions'

type AuthenticatedUser = User & { _sid?: string }

async function hasValidCSRF(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('csrfToken')?.value
  const headerToken = request.headers.get('x-csrf-token')
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

async function authenticate(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return { payload, user: user as AuthenticatedUser | null }
}

export async function GET(request: NextRequest) {
  const { payload, user } = await authenticate(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const sessions = await listAccountSessions(payload, user.id, user._sid)
  return NextResponse.json({ sessions })
}

export async function DELETE(request: NextRequest) {
  if (!(await hasValidCSRF(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const { payload, user } = await authenticate(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const sessionId =
    body &&
    typeof body === 'object' &&
    typeof (body as { sessionId?: unknown }).sessionId === 'string'
      ? (body as { sessionId: string }).sessionId.trim()
      : ''
  const allOthers =
    body && typeof body === 'object' && (body as { allOthers?: unknown }).allOthers === true

  if (Boolean(sessionId) === allOthers) {
    return NextResponse.json({ error: 'Choose one session or all other sessions' }, { status: 400 })
  }

  if (allOthers) {
    const revoked = await revokeOtherAccountSessions(payload, user.id, user._sid)
    return NextResponse.json({ revoked })
  }

  const revoked = await revokeAccountSession(payload, user.id, sessionId, user._sid)
  if (!revoked) {
    return NextResponse.json(
      { error: 'The current session must be ended with Sign out' },
      { status: 400 },
    )
  }

  return NextResponse.json({ revoked: 1 })
}
