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

/** Returns `val` if it's in `arr`, otherwise `fallback`. */
function pick<T>(arr: readonly T[], val: unknown, fallback: T): T {
  return (arr as unknown[]).includes(val) ? (val as T) : fallback
}

/** MongoDB ObjectId regex — 24 hex characters. */
const OBJECT_ID_RE = /^[a-f\d]{24}$/i

function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && OBJECT_ID_RE.test(id)
}

/**
 * Convert any date-like value to a valid ISO datetime string.
 * Handles: "HH:MM", ISO date-only "YYYY-MM-DD", full ISO strings, null/undefined.
 * Returns null if the value cannot be parsed into a valid date.
 */
function toISODateTime(value: unknown, timeOfDay = '08:00'): string | null {
  if (!value) return null
  const str = String(value).trim()

  // "HH:MM" only — anchor to next Monday at that time
  if (/^\d{2}:\d{2}$/.test(str)) {
    const [hh, mm] = str.split(':').map(Number)
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day))
    d.setHours(hh, mm, 0, 0)
    return d.toISOString()
  }

  // "YYYY-MM-DD" date-only — add time component
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [hh, mm] = timeOfDay.split(':').map(Number)
    const d = new Date(`${str}T00:00:00`)
    if (isNaN(d.getTime())) return null
    d.setHours(hh, mm, 0, 0)
    return d.toISOString()
  }

  // Full ISO string or anything Date can parse
  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

/**
 * Sanitise and normalise a raw study plan body from the AI.
 * validSubjectIds: Set of real MongoDB ObjectIds fetched from the DB.
 * validAcademicLevelId: A real ObjectId for the academic level (from DB or user profile).
 */
function sanitizeStudyPlan(
  raw: Record<string, any>,
  userId: string,
  validSubjectIds: Set<string>,
  validAcademicLevelId: string,
): Record<string, any> {
  // Extract subject ID from a slot — accepts string or {id} object, validates against DB
  function resolveSubjectId(s: unknown): string | null {
    const id = typeof s === 'string' ? s : (s as any)?.id
    return isValidObjectId(id) && validSubjectIds.has(id) ? id : null
  }

  return {
    user: userId,

    goals: typeof raw.goals === 'string' ? raw.goals.slice(0, 1000) : null,

    planType: pick(VALID_PLAN_TYPES, raw.planType, 'regular_study'),

    targetExamDate: toISODateTime(raw.targetExamDate),

    // subjects — validated against real DB ObjectIds
    subjects: Array.isArray(raw.subjects)
      ? (raw.subjects as unknown[])
          .map(resolveSubjectId)
          .filter((id): id is string => id !== null)
          .filter((id, i, arr) => arr.indexOf(id) === i) // deduplicate
      : [],

    academicLevel: validAcademicLevelId,

    // weeklySchedule — sessions with invalid or unrecognised subject IDs are dropped
    weeklySchedule: Array.isArray(raw.weeklySchedule)
      ? (raw.weeklySchedule as any[])
          .map((s) => {
            const subjectId = resolveSubjectId(s.subject)
            if (!subjectId) return null
            if (!VALID_DAYS.includes(s.dayOfWeek)) return null
            return {
              dayOfWeek: s.dayOfWeek,
              startTime: typeof s.startTime === 'string' ? s.startTime : '09:00',
              endTime: typeof s.endTime === 'string' ? s.endTime : '10:00',
              subject: subjectId,
              topics: [],
              sessionType: pick(VALID_SESSION_TYPES, s.sessionType, 'study'),
              isActive: s.isActive !== false,
            }
          })
          .filter((s): s is NonNullable<typeof s> => s !== null)
      : [],

    // studyGoals
    studyGoals: Array.isArray(raw.studyGoals)
      ? (raw.studyGoals as any[]).map((g) => ({
          title:
            typeof g.title === 'string'
              ? g.title
              : typeof g.goal === 'string'
                ? g.goal
                : 'Study goal',
          description: typeof g.description === 'string' ? g.description : null,
          targetDate: toISODateTime(g.targetDate),
          priority: pick(VALID_PRIORITY, g.priority, 'medium'),
          status: pick(VALID_GOAL_STATUS, g.status, 'not_started'),
        }))
      : [],

    // milestones — targetDate is required by Payload schema; default to 30 days from now
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

    // studyReminders — reminderTime is type: 'date', needs full ISO datetime
    studyReminders: Array.isArray(raw.studyReminders)
      ? (raw.studyReminders as any[]).map((r) => ({
          title:
            typeof r.title === 'string'
              ? r.title
              : typeof r.message === 'string'
                ? r.message.slice(0, 100)
                : 'Study reminder',
          message: typeof r.message === 'string' ? r.message : null,
          reminderTime:
            toISODateTime(r.reminderTime ?? r.time) ??
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          reminderType: pick(VALID_REMINDER_TYPES, r.reminderType, 'study_session'),
          isRecurring: r.isRecurring !== false,
          recurrencePattern: pick(VALID_RECURRENCE, r.recurrencePattern, 'weekly'),
          isActive: r.isActive !== false,
        }))
      : [],

    // studyPreferences — validate every sub-field
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
      // studyMethod is select+hasMany — filter to only valid enum values
      studyMethod: Array.isArray(raw.studyPreferences?.studyMethod)
        ? (raw.studyPreferences.studyMethod as unknown[]).filter(
            (m): m is (typeof VALID_STUDY_METHODS)[number] =>
              (VALID_STUDY_METHODS as readonly unknown[]).includes(m),
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

    // ---- Resolve a valid academicLevel ObjectId --------------------------------
    // Prefer what the client sent; fall back to user's profile; fall back to first in DB.
    let academicLevelId: string | null = isValidObjectId(raw.academicLevel)
      ? raw.academicLevel
      : null

    if (!academicLevelId) {
      // Try user profile
      const userAcademicLevel = (user as any).academicLevel
      if (isValidObjectId(userAcademicLevel)) {
        academicLevelId = userAcademicLevel
      } else if (typeof userAcademicLevel === 'object' && isValidObjectId(userAcademicLevel?.id)) {
        academicLevelId = userAcademicLevel.id
      }
    }

    if (!academicLevelId) {
      // Fall back to first academic level in DB
      const levels = await payload.find({ collection: 'academicLevels', limit: 1 })
      academicLevelId = (levels.docs[0]?.id as string) ?? null
    }

    if (!academicLevelId) {
      return NextResponse.json(
        { error: 'No academic levels found in your system. Please add one in the admin panel.' },
        { status: 400 },
      )
    }

    // ---- Fetch all valid subject ObjectIds from the DB -------------------------
    const allSubjects = await payload.find({ collection: 'subjects', limit: 500 })
    const validSubjectIds = new Set(allSubjects.docs.map((s) => s.id as string))

    // ---- Sanitize and save -----------------------------------------------------
    let data = sanitizeStudyPlan(raw, user.id, validSubjectIds, academicLevelId)

    // ---- Unroll Timetable and Extract Subjects ---------------------------------
    // 1. Compile all unique subjects mentioned across the entire plan
    const subjectSet = new Set<string>()
    if (Array.isArray(data.subjects)) {
      for (const s of data.subjects) subjectSet.add(s as string)
    }
    for (const s of data.weeklySchedule) subjectSet.add(s.subject)
    for (const g of data.studyGoals) {
      if ((g as any).subject) subjectSet.add((g as any).subject)
    }
    for (const m of data.milestones) {
      if (Array.isArray((m as any).subjects)) {
        for (const s of (m as any).subjects) subjectSet.add(s)
      }
    }
    data.subjects = Array.from(subjectSet)

    // 2. Compute date bounds and unroll the weekly schedule
    const startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    let endDate = new Date(startDate)

    // Default to +12 weeks if no exam date
    if (data.planType === 'exam_prep' && data.targetExamDate) {
      const examDate = new Date(data.targetExamDate as string)
      if (examDate > startDate) endDate = examDate
      else endDate.setUTCDate(endDate.getUTCDate() + 12 * 7)
    } else {
      endDate.setUTCDate(endDate.getUTCDate() + 12 * 7)
    }

    const unrolledTimetable: any[] = []
    const dayDelta = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    // 3. Keep past timetable elements (so we don't wipe progress if adjusting a plan)
    const existing = await payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
    })
    const existingPlan = existing.docs[0]

    if (existingPlan?.timetable) {
      const pastItems = (existingPlan.timetable as any[]).filter((t: any) => {
        const itemDate = new Date(t.date)
        return itemDate < startDate
      })
      unrolledTimetable.push(...pastItems)
    }

    // 4. Generate the unrolled timetable from today to endDate

    // We iterate from start to end
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dow = dayDelta[d.getDay()]
      const dayStr = d.toISOString()

      const daySessions = data.weeklySchedule.filter((s: any) => s.dayOfWeek === dow && s.isActive)
      for (const session of daySessions) {
        unrolledTimetable.push({
          date: dayStr,
          startTime: session.startTime,
          endTime: session.endTime,
          subject: session.subject,
          sessionType: session.sessionType,
          status: 'pending',
          note: null,
        })
      }
    }

    data.timetable = unrolledTimetable

    // Warn in dev if the AI produced no sessions with valid subjects
    if (
      data.weeklySchedule.length === 0 &&
      Array.isArray(raw.weeklySchedule) &&
      raw.weeklySchedule.length > 0
    ) {
      console.warn(
        '[study-plans/upsert] All weeklySchedule sessions were dropped — subject IDs not recognised:',
        (raw.weeklySchedule as any[]).map((s: any) => s.subject),
        'Valid IDs:',
        [...validSubjectIds],
      )
    }

    let plan
    if (existingPlan) {
      plan = await payload.update({
        collection: 'study-plans',
        id: existingPlan.id,
        data: data as any,
      })
    } else {
      plan = await payload.create({
        collection: 'study-plans',
        data: data as any,
      })
    }

    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('Study plan upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
