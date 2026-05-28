/**
 * Shared utility for unrolling a weekly schedule into concrete day-by-day
 * timetable sessions. Used by both the study-plans upsert route and the
 * auto-extend logic on the planner page.
 */

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export interface WeeklySession {
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  sessionType: string
  isActive: boolean
}

export interface TimetableEntry {
  date: string
  startTime: string
  endTime: string
  subject: string
  sessionType: string
  status: 'pending' | 'completed' | 'missed' | 'rescheduled'
  note: string | null
}

export interface UnrollOptions {
  weeklySchedule: WeeklySession[]
  startDate: Date
  endDate: Date
  /** Past timetable entries to preserve (e.g. completed/missed sessions). */
  existingPastSessions?: TimetableEntry[]
}

/**
 * Unrolls a weekly schedule template into a flat array of day-by-day
 * timetable sessions between `startDate` and `endDate` (inclusive).
 *
 * Past sessions (before `startDate`) from `existingPastSessions` are
 * prepended so historical progress is not lost.
 */
export function unrollTimetable({
  weeklySchedule,
  startDate,
  endDate,
  existingPastSessions = [],
}: UnrollOptions): TimetableEntry[] {
  const result: TimetableEntry[] = []

  // 1. Preserve past entries (before startDate)
  for (const entry of existingPastSessions) {
    if (new Date(entry.date) < startDate) {
      result.push(entry)
    }
  }

  // 2. Generate new entries from startDate to endDate
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const dow = DAY_NAMES[cursor.getDay()]
    const dayStr = cursor.toISOString()

    const daySessions = weeklySchedule.filter(
      (s) => s.dayOfWeek === dow && s.isActive,
    )

    for (const session of daySessions) {
      result.push({
        date: dayStr,
        startTime: session.startTime,
        endTime: session.endTime,
        subject: session.subject,
        sessionType: session.sessionType,
        status: 'pending',
        note: null,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

/**
 * Computes the end date for timetable unrolling.
 *
 * - For exam_prep plans with a future target date, uses the exam date.
 * - Otherwise, defaults to 12 weeks from `startDate`.
 */
export function computeEndDate(
  startDate: Date,
  planType: string | null | undefined,
  targetExamDate: string | null | undefined,
): Date {
  const endDate = new Date(startDate)

  if (planType === 'exam_prep' && targetExamDate) {
    const examDate = new Date(targetExamDate)
    if (examDate > startDate) {
      return examDate
    }
  }

  endDate.setUTCDate(endDate.getUTCDate() + 12 * 7)
  return endDate
}
