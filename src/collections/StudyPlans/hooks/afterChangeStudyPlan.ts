import type { CollectionAfterChangeHook } from 'payload'
import type { StudyPlan } from '@/payload-types'

/**
 * After a study plan is created or updated, auto-generate per-session
 * `studyReminders` entries from the `timetable` sessions.
 *
 * Each reminder fires 30 minutes before the session's start time.
 * Only future sessions within the next 14 days are processed (rolling
 * window kept manageable; reminders for later sessions are generated
 * on subsequent plan updates or page visits that trigger auto-extend).
 *
 * Uses `context.skipReminderGeneration` to prevent infinite loops when
 * this hook triggers an update on the same collection.
 */
export const generateReminders: CollectionAfterChangeHook<StudyPlan> = async ({
  doc,
  req,
  context,
}) => {
  // Prevent infinite loop: this hook calls payload.update on the same
  // collection, which would trigger afterChange again.
  if (context.skipReminderGeneration) return doc

  const timetable = (doc.timetable ?? []) as NonNullable<StudyPlan['timetable']>
  if (timetable.length === 0) return doc

  const now = new Date()
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  // Collect existing reminders that are still relevant (already sent, or
  // outside the 14-day window) so we don't wipe them.
  const existingReminders = (doc.studyReminders ?? []) as NonNullable<StudyPlan['studyReminders']>
  const sentReminders = existingReminders.filter((r) => r.isSent)

  // Build a set of existing unsent reminder times to avoid duplicates
  const existingUnsentTimes = new Set(
    existingReminders
      .filter((r) => !r.isSent && r.reminderType === 'study_session')
      .map((r) => new Date(r.reminderTime).getTime()),
  )

  // Generate one reminder per session, 30 minutes before start time
  const newReminders: NonNullable<StudyPlan['studyReminders']> = []

  for (const session of timetable) {
    if (session.status === 'completed' || session.status === 'missed') continue

    const sessionDate = new Date(session.date)

    // Only process sessions in the next 14 days
    if (sessionDate < now || sessionDate > fourteenDaysFromNow) continue

    // Parse start time (e.g. "09:00") and compute reminder time (30 min before)
    const [hours, minutes] = (session.startTime ?? '00:00').split(':').map(Number)
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(hours, minutes, 0, 0)

    const reminderTime = new Date(sessionStart.getTime() - 30 * 60 * 1000)

    // Skip if reminder time is in the past or already exists
    if (reminderTime <= now) continue
    if (existingUnsentTimes.has(reminderTime.getTime())) continue

    // Resolve subject name for the reminder message
    const subjectName =
      typeof session.subject === 'object' && session.subject !== null
        ? (session.subject as any).name ?? 'Study'
        : 'Study'

    const timeStr = sessionStart.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })

    newReminders.push({
      title: `📚 ${subjectName} session at ${timeStr}`,
      message: `Your ${session.sessionType ?? 'study'} session for ${subjectName} starts in 30 minutes (${session.startTime}–${session.endTime}).`,
      reminderTime: reminderTime.toISOString(),
      reminderType: 'study_session',
      isRecurring: false,
      isActive: true,
      isSent: false,
    })
  }

  // Merge: keep sent reminders + new unsent reminders
  const allReminders = [...sentReminders, ...newReminders]

  // Only update if reminders actually changed
  if (newReminders.length === 0 && sentReminders.length === existingReminders.length) {
    return doc
  }

  try {
    await req.payload.update({
      collection: 'study-plans',
      id: doc.id,
      data: { studyReminders: allReminders } as any,
      req, // Thread req for transaction safety
      context: { skipReminderGeneration: true }, // Prevent hook loop
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to auto-generate study reminders', err: err as Error })
  }

  return doc
}
