import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import config from '@/payload.config'

/**
 * Secure, extensionless proxy that fetches a PDF from Payload's media API.
 * Because the URL does not end in .pdf, aggressive download managers like IDM
 * will not automatically intercept and hijack the request.
 *
 * Usage: GET /api/secure-pdf/[mediaId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Auth check
  const { user } = await payload.auth({ headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mediaId } = await params

  try {
    // Get the media document to find its URL and filename
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId,
    })

    if (!media || !media.url) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Build the absolute URL to Payload's media file endpoint
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`
    const absoluteUrl = media.url.startsWith('http')
      ? media.url
      : `${serverUrl}${media.url}`

    // Fetch the actual PDF bytes from Payload's media endpoint
    const fileRes = await fetch(absoluteUrl, {
      headers: {
        // Forward cookies so Payload's access control passes
        cookie: headers.get('cookie') || '',
      },
    })

    if (!fileRes.ok) {
      console.error('[secure-pdf] Upstream error:', fileRes.status, fileRes.statusText)
      return NextResponse.json(
        { error: `Upstream error: ${fileRes.status}` },
        { status: fileRes.status },
      )
    }

    const buffer = await fileRes.arrayBuffer()
    
    // Convert to Base64 to send as JSON. This completely bypasses IDM and any 
    // other download managers because the browser sees it as a standard JSON API call.
    const base64 = Buffer.from(buffer).toString('base64')

    return NextResponse.json({ data: base64 }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[secure-pdf] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
