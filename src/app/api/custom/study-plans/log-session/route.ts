import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const VALID_STATUSES = ['completed', 'missed', 'rescheduled', 'pending'] as const
type LogStatus = (typeof VALID_STATUSES)[number]

type TimetableSession = {
  id?: string
  date: string
  status?: string
}

/** Calculate overall progress: completed past sessions / expected past sessions */
function calcProgress(timetable: TimetableSession[]): number {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const pastSessions = timetable.filter((t) => new Date(t.date) <= now)
  const expectedSessions = pastSessions.length
  if (expectedSessions === 0) return 0

  const completed = pastSessions.filter((t) => t.status === 'completed').length
  return Math.min(100, Math.round((completed / expectedSessions) * 100))
}

/** Calculate current streak: consecutive weeks with ≥80% past sessions completed */
function calcStreak(timetable: TimetableSession[]): number {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const pastSessions = timetable.filter((t) => new Date(t.date) <= now)

  // Group logs by ISO week
  const weekMap = new Map<string, { completed: number; total: number }>()
  for (const t of pastSessions) {
    const d = new Date(t.date)
    // ISO week key: year-week
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
    )
    const weekNum = Math.ceil(dayOfYear / 7)
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    const entry = weekMap.get(key) ?? { completed: 0, total: 0 }
    entry.total++
    if (t.status === 'completed') entry.completed++
    weekMap.set(key, entry)
  }

  // Count backward from current week
  let streak = 0
  const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  for (const [, { completed, total }] of sortedWeeks) {
    if (total > 0 && completed / total >= 0.8) streak++
    else break
  }
  return streak
}

/** Calculate this week's completion rate */
function calcWeeklyRate(timetable: TimetableSession[]): number {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const thisWeekSessions = timetable.filter((t) => {
    const d = new Date(t.date)
    return d >= startOfWeek && d < endOfWeek
  })

  if (thisWeekSessions.length === 0) return 0
  const completed = thisWeekSessions.filter((t) => t.status === 'completed').length
  return Math.min(100, Math.round((completed / thisWeekSessions.length) * 100))
}

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
