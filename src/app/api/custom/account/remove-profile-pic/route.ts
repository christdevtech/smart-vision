import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { logContent, logSecurity } from '@/utilities/activityLogger'

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

    const { mediaId, force } = await request.json()
    if (!mediaId) return NextResponse.json({ error: 'mediaId is required' }, { status: 400 })

    const currentPic = typeof user.profilePic === 'string' ? user.profilePic : user.profilePic?.id
    if (!force) {
      if (!currentPic || currentPic !== mediaId) {
        return NextResponse.json({ error: 'Profile picture mismatch' }, { status: 400 })
      }
    }

    try {
      await payload.delete({ collection: 'media', id: mediaId })
    } catch (e) {
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    if (currentPic === mediaId) {
      await payload.update({ collection: 'users', id: user.id, data: { profilePic: null } })
    }

    await logContent('profile_image_removed', user.id, 'media', mediaId, { req: request as any })
    await logSecurity('profile_image_removed', user.id, { req: request as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}