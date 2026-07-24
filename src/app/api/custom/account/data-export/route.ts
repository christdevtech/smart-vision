import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { buildAccountPrivacyExport } from '@/services/accountPrivacy'
import { activityLogger } from '@/utilities/activityLogger'

async function hasValidCSRF(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('csrfToken')?.value
  const headerToken = request.headers.get('x-csrf-token')
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

export async function POST(request: NextRequest) {
  if (!(await hasValidCSRF(request))) {
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
    await payload.login({
      collection: 'users',
      data: { email: user.email, password },
    })
  } catch {
    await activityLogger.logSecurity('failed_login', user.id, { req: request as any })
    return NextResponse.json({ error: 'Password verification failed' }, { status: 400 })
  }

  try {
    const exported = await buildAccountPrivacyExport(payload, user.id)
    await activityLogger.logSecurity('data_export', user.id, { req: request as any })

    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(exported, null, 2), {
      headers: {
        'Cache-Control': 'no-store, private',
        'Content-Disposition': `attachment; filename="smartvision-data-${date}.json"`,
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    payload.logger.error({
      err: error instanceof Error ? error : new Error(String(error)),
      msg: 'Could not build account data export',
    })
    return NextResponse.json({ error: 'Could not create data export' }, { status: 500 })
  }
}
