/**
 * Shared study plan analytics calculations.
 *
 * Extracted from the log-session route so they can be reused by
 * the auto-tracking utility and any future consumers.
 */

export type TimetableSession = {
  id?: string
  date: string
  startTime?: string
  endTime?: string
  status?: string
  subject?: string | { id: string; [key: string]: unknown }
}

/** Calculate overall progress: completed past sessions / expected past sessions */
export function calcProgress(timetable: TimetableSession[]): number {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const pastSessions = timetable.filter((t) => new Date(t.date) <= now)
  const expectedSessions = pastSessions.length
  if (expectedSessions === 0) return 0

  const completed = pastSessions.filter((t) => t.status === 'completed').length
  return Math.min(100, Math.round((completed / expectedSessions) * 100))
}

/** Calculate current streak: consecutive weeks with ≥80% past sessions completed */
export function calcStreak(timetable: TimetableSession[]): number {
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
export function calcWeeklyRate(timetable: TimetableSession[]): number {
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

/**
 * Parse a time string like "09:00" or "14:30" into total minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Calculate the duration in minutes between two time strings.
 */
export function sessionDurationMinutes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  return end > start ? end - start : 0
}
