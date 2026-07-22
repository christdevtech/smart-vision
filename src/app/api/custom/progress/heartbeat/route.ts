import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { resolveContentAccess } from '@/services/contentAuthorization'
import {
  parseProgressHeartbeatInput,
  recordProgressHeartbeat,
  relationshipId,
  relationshipIds,
} from '@/services/progressHeartbeat'
import { autoTrackStudySession } from '@/utilities/autoTrackStudySession'
import { authenticateRequestUser } from '@/utilities/requestAuthorization'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = await authenticateRequestUser(payload, request.headers)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let input
    try {
      input = parseProgressHeartbeatInput(await request.json())
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid progress heartbeat' },
        { status: 400 },
      )
    }

    const access = await resolveContentAccess({
      contentId: input.contentId,
      contentType: input.contentType,
      payload,
      user: user as User,
    })

    if (!access.content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }
    if (!access.allowed) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    const subjectId = relationshipId(access.content.subject)
    const result = await recordProgressHeartbeat({
      input,
      metadata: {
        academicLevel: relationshipId(access.content.academicLevel),
        subject: subjectId,
        topic: relationshipIds('topic' in access.content ? access.content.topic : undefined),
      },
      payload,
      userId: user.id,
    })

    if (result.accepted && subjectId) {
      try {
        await autoTrackStudySession({
          userId: user.id,
          subjectId,
          timeSpentMinutes: result.timeSpent,
          req: {
            headers: request.headers,
            payload,
            user,
          } as PayloadRequest,
        })
      } catch (error) {
        payload.logger.error({
          msg: 'Auto-track study session failed after progress heartbeat',
          err: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const payload = await getPayload({ config })
    payload.logger.error({
      msg: 'Progress heartbeat failed',
      err: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
