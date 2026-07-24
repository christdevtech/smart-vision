import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { reconcileProfileMedia } from '@/services/profileMediaReconciliation'
import { authorizeAdministrativeRequest } from '@/utilities/requestAuthorization'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const authorization = await authorizeAdministrativeRequest(payload, request.headers, {
    bearerSecret: process.env.CRON_SECRET,
  })

  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 1_024) {
    return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
  }

  let body: unknown = {}
  try {
    const rawBody = await request.text()
    if (rawBody.length > 1_024) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
    }
    if (rawBody) body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rawLimit = (body as { limit?: unknown }).limit
  const limit = rawLimit === undefined ? 100 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    return NextResponse.json({ error: 'Limit must be an integer from 1 to 500' }, { status: 400 })
  }

  const applyMetadata = (body as { applyMetadata?: unknown }).applyMetadata === true

  try {
    const report = await reconcileProfileMedia(payload, { applyMetadata, limit })
    payload.logger.info(
      `Profile media reconciliation checked ${report.checked} references; ${report.metadataUpdated} metadata records updated; ${report.missingR2Objects} R2 objects missing`,
    )
    return NextResponse.json({ applyMetadata, ...report })
  } catch (error) {
    payload.logger.error({
      err: error instanceof Error ? error : new Error(String(error)),
      msg: 'Profile media reconciliation failed',
    })
    return NextResponse.json({ error: 'Profile media reconciliation failed' }, { status: 503 })
  }
}
