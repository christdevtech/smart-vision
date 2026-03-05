import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// ---------------------------------------------------------------------------
// Schema constants — kept in sync with StudyPlans collection definition
// ---------------------------------------------------------------------------
const VALID_PLAN_TYPES = ['exam_prep', 'regular_study', 'revision', 'catch_up', 'advanced'] as const
const VALID_SESSION_TYPES = ['study', 'practice', 'revision', 'test'] as const
const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const
const VALID_STUDY_METHODS = [
  'reading',
  'video',
  'practice',
  'notes',
  'group',
  'flashcards',
] as const
const VALID_STUDY_TIMES = [
  'early_morning',
  'morning',
  'afternoon',
  'evening',
  'night',
  'late_night',
] as const
const VALID_DIFFICULTY = ['easy_first', 'hard_first', 'mixed'] as const
const VALID_GOAL_STATUS = ['not_started', 'in_progress', 'completed', 'paused'] as const
const VALID_PRIORITY = ['high', 'medium', 'low'] as const
const VALID_REMINDER_TYPES = [
  'study_session',
  'assignment_due',
  'exam_reminder',
  'goal_deadline',
  'custom',
] as const
const VALID_RECURRENCE = ['daily', 'weekly', 'monthly'] as const

type ValidPlanType = (typeof VALID_PLAN_TYPES)[number]
type ValOrDefault<T> = (arr: readonly T[], val: unknown, fallback: T) => T

const pick: ValOrDefault<any> = (arr, val, fallback) =>
  (arr as any[]).includes(val) ? val : fallback

/**
 * Convert any date-like value to a valid ISO datetime string.
 * Handles: "HH:MM", ISO date-only "YYYY-MM-DD", full ISO strings, null/undefined.
 * Returns null if the value cannot be parsed.
 */
function toISODateTime(value: unknown, timeOfDay = '08:00'): string | null {
  if (!value) return null

  const str = String(value).trim()

  // "HH:MM" only — anchor to next Monday at that time
  if (/^\d{2}:\d{2}$/.test(str)) {
    const [hh, mm] = str.split(':').map(Number)
    const date = new Date()
    const day = date.getDay()
    const daysToMonday = day === 0 ? 1 : 8 - day
    date.setDate(date.getDate() + daysToMonday)
    date.setHours(hh, mm, 0, 0)
    return date.toISOString()
  }

  // "YYYY-MM-DD" date-only — add a time component
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [hh, mm] = timeOfDay.split(':').map(Number)
    const date = new Date(`${str}T00:00:00`)
    if (isNaN(date.getTime())) return null
    date.setHours(hh, mm, 0, 0)
    return date.toISOString()
  }

  // Already a full ISO string or something Date can parse
  const date = new Date(str)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Sanitise and normalise a raw study plan body from the AI into a shape
 * that exactly matches the Payload StudyPlans collection schema.
 * This is the single source of truth for data transformation.
 */
function sanitizeStudyPlan(raw: Record<string, any>, userId: string): Record<string, any> {
  return {
    user: userId,

    goals: typeof raw.goals === 'string' ? raw.goals.slice(0, 1000) : null,

    planType: pick(VALID_PLAN_TYPES, raw.planType, 'regular_study') as ValidPlanType,

    targetExamDate: toISODateTime(raw.targetExamDate),

    // subjects — array of IDs (strings)
    subjects: Array.isArray(raw.subjects)
      ? (raw.subjects as any[])
          .map((s) => (typeof s === 'string' ? s : s?.id))
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [],

    academicLevel: raw.academicLevel ?? null,

    // weeklySchedule
    weeklySchedule: Array.isArray(raw.weeklySchedule)
      ? (raw.weeklySchedule as any[])
          .filter((s) => s && VALID_DAYS.includes(s.dayOfWeek))
          .map((s) => ({
            dayOfWeek: pick(VALID_DAYS, s.dayOfWeek, 'monday'),
            startTime: typeof s.startTime === 'string' ? s.startTime : '09:00',
            endTime: typeof s.endTime === 'string' ? s.endTime : '10:00',
            // subject must be a string ID
            subject:
              typeof s.subject === 'string'
                ? s.subject
                : typeof s.subject?.id === 'string'
                  ? s.subject.id
                  : null,
            topics: [],
            sessionType: pick(VALID_SESSION_TYPES, s.sessionType, 'study'),
            isActive: s.isActive !== false,
          }))
          .filter((s) => s.subject) // drop sessions without a valid subject
      : [],

    // studyGoals
    studyGoals: Array.isArray(raw.studyGoals)
      ? (raw.studyGoals as any[]).map((g) => ({
          title:
            typeof g.title === 'string'
              ? g.title
              : typeof g.goal === 'string' // AI may use 'goal' — accept it as fallback
                ? g.goal
                : 'Study goal',
          description: typeof g.description === 'string' ? g.description : null,
          targetDate: toISODateTime(g.targetDate),
          priority: pick(VALID_PRIORITY, g.priority, 'medium'),
          status: pick(VALID_GOAL_STATUS, g.status, 'not_started'),
        }))
      : [],

    // milestones — targetDate is required in Payload schema
    milestones: Array.isArray(raw.milestones)
      ? (raw.milestones as any[]).map((m) => ({
          title: typeof m.title === 'string' ? m.title : 'Milestone',
          description: typeof m.description === 'string' ? m.description : null,
          targetDate:
            toISODateTime(m.targetDate) ??
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false,
        }))
      : [],

    // studyReminders — reminderTime is a Payload date field (full ISO datetime required)
    studyReminders: Array.isArray(raw.studyReminders)
      ? (raw.studyReminders as any[]).map((r) => ({
          title:
            typeof r.title === 'string'
              ? r.title
              : typeof r.message === 'string' // AI may use 'message' — accept as title fallback
                ? r.message.slice(0, 100)
                : 'Study reminder',
          message: typeof r.message === 'string' ? r.message : null,
          // HH:MM → full ISO datetime anchored to next Monday
          reminderTime:
            toISODateTime(r.reminderTime ?? r.time) ??
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          reminderType: pick(VALID_REMINDER_TYPES, r.reminderType, 'study_session'),
          isRecurring: r.isRecurring !== false,
          recurrencePattern: pick(VALID_RECURRENCE, r.recurrencePattern, 'weekly'),
          isActive: r.isActive !== false,
        }))
      : [],

    // studyPreferences — group field, each sub-field validated individually
    studyPreferences: {
      preferredStudyTime: pick(
        VALID_STUDY_TIMES,
        raw.studyPreferences?.preferredStudyTime,
        'morning',
      ),
      sessionDuration:
        typeof raw.studyPreferences?.sessionDuration === 'number' &&
        raw.studyPreferences.sessionDuration > 0
          ? raw.studyPreferences.sessionDuration
          : 60,
      breakDuration:
        typeof raw.studyPreferences?.breakDuration === 'number' &&
        raw.studyPreferences.breakDuration > 0
          ? raw.studyPreferences.breakDuration
          : 15,
      // studyMethod is a multi-select — filter to only valid enum values
      studyMethod: Array.isArray(raw.studyPreferences?.studyMethod)
        ? (raw.studyPreferences.studyMethod as string[]).filter(
            (m): m is (typeof VALID_STUDY_METHODS)[number] =>
              (VALID_STUDY_METHODS as readonly string[]).includes(m),
          )
        : [],
      difficultyPreference: pick(
        VALID_DIFFICULTY,
        raw.studyPreferences?.difficultyPreference,
        'easy_first',
      ),
    },

    timetable: [],
    isActive: true,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = await request.json()
    const data = sanitizeStudyPlan(raw, user.id)

    const existing = await payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    let plan
    if (existing.docs[0]) {
      plan = await payload.update({
        collection: 'study-plans',
        id: existing.docs[0].id,
        data: data as any,
      })
    } else {
      plan = await payload.create({ collection: 'study-plans', data: data as any })
    }

    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('Study plan upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
