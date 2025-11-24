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

function validatePasswordComplexity(pw: string) {
  return (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw) &&
    pw.length >= 8
  )
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
    const { currentPassword, newPassword } = body || {}
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 })
    }
    if (!validatePasswordComplexity(newPassword)) {
      return NextResponse.json(
        { error: 'Password does not meet complexity requirements' },
        { status: 400 },
      )
    }

    try {
      await payload.login({
        collection: 'users',
        data: { email: user.email, password: currentPassword },
      })
    } catch {
      await activityLogger.logSecurity('failed_login', user.id, { req: request as any })
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    await payload.update({ collection: 'users', id: user.id, data: { password: newPassword } })

    await activityLogger.logSecurity('password_changed', user.id, { req: request as any })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
