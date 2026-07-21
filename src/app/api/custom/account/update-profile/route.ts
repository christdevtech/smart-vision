import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { logActivity } from '@/utilities/activityLogger'
import { parseProfileUpdate, ProfileUpdateValidationError } from '@/utilities/profileUpdate'

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

    const body = await request.json()
    const data = parseProfileUpdate(body?.data)

    // This trusted server endpoint intentionally uses the Local API after reducing input to the
    // explicit profile allowlist above. The authenticated user ID is never accepted from the client.
    const updated = await payload.update({ collection: 'users', id: user.id, data })
    await logActivity(
      {
        action: 'profile.updated',
        user: user.id,
        category: 'profile',
        metadata: { fields: Object.keys(data) },
      },
      { req: request as any },
    )

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    if (error instanceof ProfileUpdateValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
