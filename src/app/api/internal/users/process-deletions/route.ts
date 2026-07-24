import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { processDueAccountDeletions } from '@/services/accountPrivacy'
import { authorizeAdministrativeRequest } from '@/utilities/requestAuthorization'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const authorization = await authorizeAdministrativeRequest(payload, request.headers, {
    bearerSecret: process.env.CRON_SECRET,
  })

  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processDueAccountDeletions(payload)
  return NextResponse.json({
    ok: result.errors === 0,
    ...result,
    processedAt: new Date().toISOString(),
  })
}
