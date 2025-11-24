import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { activityLogger } from '@/utilities/activityLogger'

async function validateCSRF(request: NextRequest) {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('csrfToken')?.value
  const headerToken = request.headers.get('x-csrf-token')
  return cookieToken && headerToken && cookieToken === headerToken
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRF(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const body = await request.json()
    const { password } = body || {}
    if (!password) return NextResponse.json({ error: 'Password is required' }, { status: 400 })

    try {
      await payload.login({ collection: 'users', data: { email: user.email, password } })
    } catch {
      await activityLogger.logSecurity('failed_login', user.id, { req: request as any })
      return NextResponse.json({ error: 'Password verification failed' }, { status: 400 })
    }

    await activityLogger.logSecurity('account_deletion_request', user.id, { req: request as any })
    await payload.delete({ collection: 'users', id: user.id })
    await activityLogger.logSecurity('account_deleted', user.id, { req: request as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}