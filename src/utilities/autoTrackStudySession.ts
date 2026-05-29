/**
 * Auto-tracks study plan sessions based on platform activity.
 *
 * When a student engages with content for a subject (watches a video,
 * reads a book, takes a test), this utility checks if they have any
 * pending timetable sessions for that subject today and marks them
 * as completed based on engagement thresholds.
 *
 * Matching rules:
 * - Requires a minimum of 5 minutes of engagement (timeSpent) for the subject
 * - Auto-completes the first pending session for the subject today
 * - If cumulative time exceeds the first session duration + 5 min, also
 *   completes the second pending session
 *
 * Language note: The notification says "attendance marked" rather than
 * "session completed" to encourage continued study.
 */

import type { PayloadRequest } from 'payload'
import {
  calcProgress,
  calcStreak,
  calcWeeklyRate,
  sessionDurationMinutes,
  type TimetableSession,
} from './studyPlanAnalytics'

/** Minimum minutes of engagement required to auto-track a session */
const MIN_ENGAGEMENT_MINUTES = 5

interface AutoTrackInput {
  userId: string
  subjectId: string
  /** Cumulative time the user has spent on this subject today, in minutes */
  timeSpentMinutes: number
  req: PayloadRequest
}

interface AutoTrackResult {
  /** Number of sessions that were auto-completed in this call */
  sessionsCompleted: number
  /** Notification message to show the student, if any */
  notification?: string
  /** The subject name, for the notification */
  subjectName?: string
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getSubjectId(subject: string | { id: string; [key: string]: unknown } | undefined): string | null {
  if (!subject) return null
  if (typeof subject === 'string') return subject
  return subject.id
}

export async function autoTrackStudySession({
  userId,
  subjectId,
  timeSpentMinutes,
  req,
}: AutoTrackInput): Promise<AutoTrackResult> {
  const payload = req.payload

  // 1. Check minimum engagement threshold
  if (timeSpentMinutes < MIN_ENGAGEMENT_MINUTES) {
    return { sessionsCompleted: 0 }
  }

  // 2. Find the user's active study plan
  const planResult = await payload.find({
    collection: 'study-plans',
    where: {
      user: { equals: userId },
      isActive: { equals: true },
    },
    limit: 1,
    depth: 1, // populate subject names for notifications
    req,
  })

  const plan = planResult.docs[0]
  if (!plan) return { sessionsCompleted: 0 }

  const timetable = (plan.timetable ?? []) as TimetableSession[]
  if (timetable.length === 0) return { sessionsCompleted: 0 }

  // 3. Find today's pending sessions for this subject, sorted by startTime
  const todayKey = toDateKey(new Date())
  const todayPendingSessions = timetable
    .filter((session) => {
      const sessionDateKey = toDateKey(new Date(session.date))
      const sessionSubjectId = getSubjectId(session.subject)
      return (
        sessionDateKey === todayKey &&
        sessionSubjectId === subjectId &&
        (!session.status || session.status === 'pending')
      )
    })
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))

  if (todayPendingSessions.length === 0) return { sessionsCompleted: 0 }

  // 4. Determine how many sessions to auto-complete
  let sessionsToComplete = 1 // Always complete the first one at minimum threshold

  if (todayPendingSessions.length >= 2) {
    const firstSession = todayPendingSessions[0]
    const firstDuration = sessionDurationMinutes(
      firstSession.startTime ?? '00:00',
      firstSession.endTime ?? '00:00',
    )

    // If cumulative engagement exceeds first session duration + threshold,
    // also auto-complete the second session
    if (timeSpentMinutes >= firstDuration + MIN_ENGAGEMENT_MINUTES) {
      sessionsToComplete = 2
    }
  }

  // 5. Mark the sessions as completed in the timetable array
  let completed = 0
  const updatedTimetable = timetable.map((session) => {
    if (completed >= sessionsToComplete) return session

    const isPendingTarget = todayPendingSessions.some((ps) => ps.id === session.id)
    if (isPendingTarget && (!session.status || session.status === 'pending')) {
      completed++
      return { ...session, status: 'completed' as const }
    }
    return session
  })

  if (completed === 0) return { sessionsCompleted: 0 }

  // 6. Recalculate analytics
  const progress = calcProgress(updatedTimetable)
  const currentStreak = calcStreak(updatedTimetable)
  const weeklyCompletionRate = calcWeeklyRate(updatedTimetable)

  const lastCompleted = updatedTimetable
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  // 7. Update the study plan
  await payload.update({
    collection: 'study-plans',
    id: plan.id as string,
    data: {
      timetable: updatedTimetable as any,
      progress,
      analytics: {
        ...(plan as any).analytics,
        currentStreak,
        weeklyCompletionRate,
        lastStudySession:
          lastCompleted?.date ?? (plan as any).analytics?.lastStudySession ?? null,
      },
    } as any,
    req,
    context: { skipReminderGeneration: true },
  })

  // 8. Resolve subject name for the notification
  const firstCompleted = todayPendingSessions[0]
  let subjectName = 'your subject'
  if (firstCompleted?.subject && typeof firstCompleted.subject === 'object') {
    subjectName = (firstCompleted.subject as any).name ?? subjectName
  } else if (typeof firstCompleted?.subject === 'string') {
    try {
      const subjectDoc = await payload.findByID({
        collection: 'subjects',
        id: firstCompleted.subject,
        req,
      })
      subjectName = (subjectDoc as any).name ?? subjectName
    } catch {
      // Fallback to generic name
    }
  }

  // 9. Create a notification for the student
  // Language: "attendance marked" — NOT "session completed" to encourage continued study
  const notificationMessage =
    completed === 1
      ? `📍 Attendance marked for your ${subjectName} study session. Keep going!`
      : `📍 Attendance marked for ${completed} ${subjectName} sessions today. Great effort — keep it up!`

  try {
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: userId,
        title: `${subjectName} — Study attendance recorded`,
        message: notificationMessage,
        type: 'study_plan',
        isRead: false,
        metadata: {
          source: 'automated',
          relatedContentType: 'study-plans',
        },
      } as any,
      req,
    })
  } catch {
    // Notification creation is non-critical — don't fail the auto-tracking
    payload.logger.error(`Failed to create auto-track notification for user ${userId}`)
  }

  return {
    sessionsCompleted: completed,
    notification: notificationMessage,
    subjectName,
  }
}
