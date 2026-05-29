import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  calcProgress,
  calcStreak,
  calcWeeklyRate,
  type TimetableSession,
} from '@/utilities/studyPlanAnalytics'

const VALID_STATUSES = ['completed', 'missed', 'rescheduled', 'pending'] as const
type LogStatus = (typeof VALID_STATUSES)[number]


export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      sessionId: string
      status: LogStatus
      note?: string
    }

    const { sessionId, status, note } = body

    if (!sessionId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Missing sessionId or invalid status' }, { status: 400 })
    }

    const existing = await payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
    })

    if (!existing.docs[0]) {
      return NextResponse.json({ error: 'No study plan found' }, { status: 404 })
    }

    const plan = existing.docs[0]
    const currentTimetable = ((plan as any).timetable ?? []) as TimetableSession[]

    // Find the session in the timetable
    const sessionIdx = currentTimetable.findIndex((t) => t.id === sessionId)
    if (sessionIdx === -1) {
      return NextResponse.json({ error: 'Session not found in timetable' }, { status: 404 })
    }

    // Update status and note
    const session = currentTimetable[sessionIdx]
    currentTimetable[sessionIdx] = {
      ...session,
      status,
      ...(note !== undefined && { note }), // Payload schema note is just string
    }

    // Recalculate analytics
    const progress = calcProgress(currentTimetable)
    const currentStreak = calcStreak(currentTimetable)
    const weeklyCompletionRate = calcWeeklyRate(currentTimetable)

    const lastCompleted = currentTimetable
      .filter((l) => l.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    const updated = await payload.update({
      collection: 'study-plans',
      id: plan.id as string,
      data: {
        timetable: currentTimetable as any,
        progress,
        analytics: {
          ...(plan as any).analytics,
          currentStreak,
          weeklyCompletionRate,
          lastStudySession:
            lastCompleted?.date ?? (plan as any).analytics?.lastStudySession ?? null,
        },
      } as any,
    })

    return NextResponse.json(
      { plan: updated, progress, currentStreak, weeklyCompletionRate },
      { status: 200 },
    )
  } catch (error) {
    console.error('Session log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
