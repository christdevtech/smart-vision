import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { activityLogger } from '@/utilities/activityLogger'
import { requestAccountDeletion } from '@/services/accountPrivacy'

async function validateCSRF(request: NextRequest) {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('csrfToken')?.value
  const headerToken = request.headers.get('x-csrf-token')
  return cookieToken && headerToken && cookieToken === headerToken
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateCSRF(request))) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const password =
      body &&
      typeof body === 'object' &&
      typeof (body as { password?: unknown }).password === 'string'
        ? (body as { password: string }).password
        : ''
    if (!password || password.length > 200) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    try {
      await payload.login({ collection: 'users', data: { email: user.email, password } })
    } catch {
      await activityLogger.logSecurity('failed_login', user.id, { req: request as any })
      return NextResponse.json({ error: 'Password verification failed' }, { status: 400 })
    }

    const deletion = await requestAccountDeletion(payload, user.id)
    await activityLogger.logSecurity(
      'account_deletion_request',
      user.id,
      { req: request as any },
      { scheduledFor: deletion.scheduledFor },
    )

    return NextResponse.json({ success: true, ...deletion })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
