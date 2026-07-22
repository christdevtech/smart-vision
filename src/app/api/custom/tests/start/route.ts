import config from '@/payload.config'
import {
  AssessmentError,
  parseStartTestInput,
  startPracticeTest,
} from '@/services/testSessionService'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new AssessmentError('Request body must be valid JSON')
    }
    const input = parseStartTestInput(body)
    const session = await startPracticeTest({ input, payload, user })
    return NextResponse.json(session, {
      headers: { 'Cache-Control': 'private, no-store' },
      status: 201,
    })
  } catch (error) {
    if (error instanceof AssessmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    payload.logger.error({ err: error, msg: 'Failed to start test session' })
    return NextResponse.json({ error: 'Unable to start test' }, { status: 500 })
  }
}
