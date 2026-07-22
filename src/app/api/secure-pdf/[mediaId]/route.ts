import config from '@/payload.config'
import { resolveContentAccess, resolveContentMedia } from '@/services/contentAuthorization'
import { verifyMediaDeliveryToken } from '@/utilities/mediaDelivery'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

const getServerURL = (request: Request): string => {
  const configuredURL = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  return configuredURL ? configuredURL.replace(/\/$/, '') : new URL(request.url).origin
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mediaId } = await params
  const delivery = new URL(request.url).searchParams.get('delivery')
  const claims = verifyMediaDeliveryToken(delivery, { mediaId, userId: user.id })

  if (!claims) {
    return NextResponse.json({ error: 'Invalid or expired media grant' }, { status: 403 })
  }

  if (!['pdf', 'answerKeyPdf'].includes(claims.field)) {
    return NextResponse.json({ error: 'This grant is not for a PDF' }, { status: 403 })
  }

  const access = await resolveContentAccess({
    contentId: claims.contentId,
    contentType: claims.contentType,
    payload,
    user,
  })

  if (!access.allowed || !access.content) {
    return NextResponse.json({ error: 'Content access denied' }, { status: 403 })
  }

  const media = await resolveContentMedia({
    content: access.content,
    contentType: claims.contentType,
    field: claims.field,
    payload,
  })

  if (
    !media ||
    media.id !== mediaId ||
    media.filename !== claims.filename ||
    media.mimeType !== 'application/pdf'
  ) {
    return NextResponse.json({ error: 'Media is not attached to this content' }, { status: 403 })
  }

  try {
    const upstreamURL = `${getServerURL(request)}/api/media/file/${encodeURIComponent(media.filename)}?delivery=${encodeURIComponent(delivery!)}`
    const fileResponse = await fetch(upstreamURL, {
      cache: 'no-store',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    })

    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Document is unavailable' }, { status: fileResponse.status })
    }

    const buffer = await fileResponse.arrayBuffer()
    return NextResponse.json(
      { data: Buffer.from(buffer).toString('base64') },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (error) {
    console.error('[secure-pdf] Failed to retrieve authorized media', error)
    return NextResponse.json({ error: 'Document is unavailable' }, { status: 502 })
  }
}
