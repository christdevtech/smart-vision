import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { logActivity } from '@/utilities/activityLogger'

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
    const { data } = body || {}
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updated = await payload.update({ collection: 'users', id: user.id, data })
    await logActivity({ action: 'profile.updated', user: user.id, category: 'profile', metadata: { fields: Object.keys(data) } }, { req: request as any })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}