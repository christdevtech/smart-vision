import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const VALID_STATUSES = ['completed', 'missed', 'rescheduled'] as const
const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

type LogStatus = (typeof VALID_STATUSES)[number]

/** Calculate overall progress: completed sessions / expected sessions since plan start */
function calcProgress(
  logs: { date: string; status: string }[],
  weeklyCount: number,
  planCreatedAt: string,
): number {
  if (weeklyCount === 0) return 0

  const start = new Date(planCreatedAt)
  const now = new Date()
  const weeksElapsed = Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)),
  )
  const expectedSessions = weeksElapsed * weeklyCount

  const completed = logs.filter((l) => l.status === 'completed').length
  return Math.min(100, Math.round((completed / expectedSessions) * 100))
}

/** Calculate current streak: consecutive weeks with ≥80% sessions completed */
function calcStreak(logs: { date: string; status: string }[], weeklyCount: number): number {
  if (weeklyCount === 0) return 0

  // Group logs by ISO week
  const weekMap = new Map<string, { completed: number; total: number }>()
  for (const log of logs) {
    const d = new Date(log.date)
    // ISO week key: year-week
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
    )
    const weekNum = Math.ceil(dayOfYear / 7)
    const key = `${d.getFullYear()}-W${weekNum}`
    const entry = weekMap.get(key) ?? { completed: 0, total: weeklyCount }
    if (log.status === 'completed') entry.completed++
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
function calcWeeklyRate(logs: { date: string; status: string }[], weeklyCount: number): number {
  if (weeklyCount === 0) return 0
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)

  const thisWeekLogs = logs.filter((l) => new Date(l.date) >= startOfWeek)
  const completed = thisWeekLogs.filter((l) => l.status === 'completed').length
  return Math.min(100, Math.round((completed / weeklyCount) * 100))
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
      date: string
      dayOfWeek: string
      sessionIndex: number
      status: LogStatus
      note?: string
    }

    const { date, dayOfWeek, sessionIndex, status, note } = body

    if (!date || !dayOfWeek || sessionIndex == null || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    // Fetch the user's study plan
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
    const currentLogs = ((plan as any).sessionLogs ?? []) as {
      date: string
      dayOfWeek: string
      sessionIndex: number
      status: string
      note?: string
      id?: string
    }[]
    const weeklySchedule = ((plan as any).weeklySchedule ?? []) as any[]

    // Normalise the date to ISO midnight UTC for consistent comparison
    const normalDate = new Date(date)
    normalDate.setUTCHours(0, 0, 0, 0)
    const normDateStr = normalDate.toISOString()

    // Upsert: if a log already exists for this date+sessionIndex, update it
    const existingLogIdx = currentLogs.findIndex((l) => {
      const d = new Date(l.date)
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString() === normDateStr && l.sessionIndex === sessionIndex
    })

    const newLog = { date: normDateStr, dayOfWeek, sessionIndex, status, note: note ?? undefined }

    let updatedLogs: typeof currentLogs
    if (existingLogIdx >= 0) {
      updatedLogs = currentLogs.map((l, i) => (i === existingLogIdx ? { ...l, ...newLog } : l))
    } else {
      updatedLogs = [...currentLogs, newLog]
    }

    // Recalculate analytics
    const progress = calcProgress(updatedLogs, weeklySchedule.length, plan.createdAt as string)
    const currentStreak = calcStreak(updatedLogs, weeklySchedule.length)
    const weeklyCompletionRate = calcWeeklyRate(updatedLogs, weeklySchedule.length)

    const lastCompleted = updatedLogs
      .filter((l) => l.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    const updated = await payload.update({
      collection: 'study-plans',
      id: plan.id as string,
      data: {
        sessionLogs: updatedLogs,
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
