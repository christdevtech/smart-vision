'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Circle,
  Flame,
  CalendarDays,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Zap,
} from 'lucide-react'
import type { StudyPlan, Subject } from '@/payload-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TimetableSession = NonNullable<StudyPlan['timetable']>[number]
type StudyGoal = NonNullable<StudyPlan['studyGoals']>[number]
type Milestone = NonNullable<StudyPlan['milestones']>[number]

interface PlanDashboardProps {
  plan: StudyPlan
  subjects: Subject[]
  onAdjust: (prefill?: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const SESSION_BG: Record<string, string> = {
  study: 'bg-primary/10 border-primary/20 text-primary',
  revision: 'bg-secondary/10 border-secondary/20 text-secondary',
  practice: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  test: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function subjectName(s: string | Subject | null | undefined, subjects: Subject[]): string {
  if (!s) return '—'
  if (typeof s === 'object') return (s as any).name ?? '—'
  return subjects.find((sub) => sub.id === s)?.name ?? s
}

function subjectSlug(s: string | Subject | null | undefined, subjects: Subject[]): string | null {
  if (!s) return null
  if (typeof s === 'object') return (s as any).slug ?? null
  const found = subjects.find((sub) => sub.id === s)
  return found?.slug ?? null
}

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

/** Build 7-day array starting from today */
function buildWeekDays(): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PlanDashboard({ plan, subjects, onAdjust }: PlanDashboardProps) {
  const today = new Date()
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0) // 0 = today
  const weekDays = useMemo(() => buildWeekDays(), [])
  const selectedDate = weekDays[selectedDayIndex]

  // Timetable is the source of truth for all sessions
  const [timetable, setTimetable] = useState<TimetableSession[]>(
    ((plan.timetable ?? []) as TimetableSession[]).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  )
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [expandGoals, setExpandGoals] = useState(false)

  const goals = (plan.studyGoals ?? []) as StudyGoal[]
  const milestones = ((plan.milestones ?? []) as Milestone[])
    .filter((m) => !m.isCompleted)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())

  // ------------ Per-day sessions -------------------------------------------
  const sessionsForDay = useCallback(
    (date: Date) => {
      const dk = toDateKey(date)
      return timetable.filter((t) => {
        const d = new Date(t.date)
        return toDateKey(d) === dk
      })
    },
    [timetable],
  )

  // ------------ Day completion status for dots ------------------------------
  const dayStatus = useCallback(
    (date: Date): 'none' | 'all-done' | 'some-done' | 'pending' | 'missed' => {
      const sessions = sessionsForDay(date)
      if (sessions.length === 0) return 'none'

      const completed = sessions.filter((s) => s.status === 'completed').length
      const missed = sessions.filter((s) => s.status === 'missed').length

      if (completed === sessions.length) return 'all-done'
      if (completed > 0) return 'some-done'
      if (missed === sessions.length) return 'missed'
      return 'pending'
    },
    [sessionsForDay],
  )

  // ------------ Progress stats ---------------------------------------------
  const progress = plan.progress ?? 0
  const streak = (plan as any).analytics?.currentStreak ?? 0

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const thisWeekSessions = timetable.filter((t) => {
    const d = new Date(t.date)
    return d >= weekStart && d < weekEnd
  })

  const weekSessionsCount = thisWeekSessions.length
  const weekDoneCount = thisWeekSessions.filter((t) => t.status === 'completed').length
  const missedThisWeek = thisWeekSessions.filter((t) => t.status === 'missed').length

  // ------------ Session logging call ---------------------------------------
  async function logSession(sessionId: string, status: 'completed' | 'missed') {
    if (!sessionId) return
    setLoggingId(sessionId)
    try {
      const resp = await fetch('/api/custom/study-plans/log-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const updatedTimetable = ((data.plan?.timetable ?? []) as TimetableSession[]).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        setTimetable(updatedTimetable)
      }
    } finally {
      setLoggingId(null)
    }
  }

  // ------------ Selected day data ------------------------------------------
  const selectedSessions = sessionsForDay(selectedDate)

  // ---- Empty-state: no sessions in the plan ----
  if (timetable.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Study Plan</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plan.goals ?? 'Active study plan'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border bg-input text-center space-y-4">
          <CalendarDays className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold text-foreground">No sessions in your plan</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your study plan doesn&apos;t have any scheduled sessions yet. Use the AI assistant to
              generate a new timetable.
            </p>
          </div>
          <button
            onClick={() => onAdjust()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate Timetable
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Study Plan</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plan.goals ?? 'Active study plan'}
          </p>
        </div>
        <button
          onClick={() => onAdjust()}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-input hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Adjust Plan
        </button>
      </div>

      {/* ---- Progress stats row ---- */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-input text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{progress}%</p>
          <p className="text-xs text-muted-foreground">Overall</p>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-input text-center">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground">Week streak</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-input text-center">
          <CalendarDays className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {weekDoneCount}/{weekSessionsCount}
          </p>
          <p className="text-xs text-muted-foreground">This week</p>
        </div>
      </div>

      {/* ---- Missed sessions banner ---- */}
      {missedThisWeek >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-warning/30 bg-warning/10"
        >
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning flex-1">
            You&apos;ve missed {missedThisWeek} sessions this week.
          </p>
          <button
            onClick={() =>
              onAdjust(
                `I missed ${missedThisWeek} study sessions this week. Can you help me reschedule them or adjust my plan?`,
              )
            }
            className="flex-shrink-0 text-xs font-medium text-warning underline underline-offset-2"
          >
            Reschedule →
          </button>
        </motion.div>
      )}

      {/* ==================== 7-DAY ROLLING VIEW ==================== */}
      <div className="rounded-2xl border border-border bg-input overflow-hidden">
        {/* Section label */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Next 7 Days</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' – '}
            {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Day strip */}
        <div className="grid grid-cols-7 divide-x divide-border">
          {weekDays.map((day, index) => {
            const isToday = index === 0
            const isSelected = index === selectedDayIndex
            const sessions = sessionsForDay(day)
            const status = dayStatus(day)

            // Status indicator color
            const dotColor =
              status === 'all-done'
                ? 'bg-emerald-500'
                : status === 'some-done'
                  ? 'bg-warning'
                  : status === 'missed'
                    ? 'bg-destructive'
                    : status === 'pending'
                      ? 'bg-primary/40'
                      : ''

            return (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center py-3 px-1 transition-all relative
                  ${isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'}
                `}
              >
                {/* Day name */}
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium mb-1
                  ${isToday ? 'text-primary' : 'text-muted-foreground'}
                `}
                >
                  {isToday ? 'Today' : DAY_NAMES[day.getDay()]}
                </span>

                {/* Date number */}
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/20 text-primary' : 'text-foreground'}
                `}
                >
                  {day.getDate()}
                </span>

                {/* Session count + status dot */}
                <div className="flex items-center gap-1 mt-1.5">
                  {sessions.length > 0 && (
                    <>
                      <span className="text-[10px] text-muted-foreground">{sessions.length}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    </>
                  )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="dayIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================== SELECTED DAY SESSIONS ==================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={toDateKey(selectedDate)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {selectedDayIndex === 0
                ? 'Today'
                : selectedDayIndex === 1
                  ? 'Tomorrow'
                  : DAY_NAMES_FULL[selectedDate.getDay()]}
              {' · '}
              {selectedDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
            {selectedSessions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedSessions.filter((s) => s.status === 'completed').length}/
                {selectedSessions.length} done
              </span>
            )}
          </div>

          {selectedSessions.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-input text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              No sessions scheduled — enjoy your rest day! 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((session, index) => {
                const isPastOrToday = toDateKey(selectedDate) <= toDateKey(today)
                const isLogging = loggingId === session.id
                const colorClass = SESSION_BG[session.sessionType ?? 'study'] ?? SESSION_BG.study
                const slug = subjectSlug(session.subject, subjects)
                const name = subjectName(session.subject, subjects)
                const isPending = !session.status || session.status === 'pending'
                const isAutoTracked =
                  session.status === 'completed' && (session as any).note?.includes?.('auto')

                return (
                  <div
                    key={session.id ?? index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${colorClass}`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {session.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {session.status === 'missed' && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      {session.status === 'rescheduled' && (
                        <CalendarDays className="w-5 h-5 text-warning" />
                      )}
                      {isPending && <Circle className="w-5 h-5 opacity-50" />}
                    </div>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium truncate">{name}</span>
                        <span className="capitalize text-xs opacity-70 flex-shrink-0">
                          {session.sessionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {fmt12(session.startTime)} – {fmt12(session.endTime)}
                        {isAutoTracked && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-medium">
                            📍 auto-tracked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Study Now link for pending sessions */}
                      {isPending && slug && (
                        <Link
                          href={`/dashboard/learning/${slug}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Study Now
                        </Link>
                      )}

                      {/* Manual logging for past/today pending sessions */}
                      {isPastOrToday && isPending && (
                        <>
                          <button
                            disabled={isLogging}
                            onClick={() => session.id && logSession(session.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          >
                            {isLogging ? '…' : 'Done ✓'}
                          </button>
                          <button
                            disabled={isLogging}
                            onClick={() => session.id && logSession(session.id, 'missed')}
                            className="px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30 transition-colors disabled:opacity-50"
                          >
                            {isLogging ? '…' : 'Missed ✕'}
                          </button>
                        </>
                      )}

                      {/* Reschedule for missed sessions */}
                      {session.status === 'missed' && (
                        <button
                          onClick={() =>
                            onAdjust(
                              `I missed my ${name} ${session.sessionType} session on ${selectedDate.toLocaleDateString('en-GB')}. Can you help me reschedule it?`,
                            )
                          }
                          className="flex-shrink-0 text-xs text-destructive underline underline-offset-2 hover:no-underline"
                        >
                          Reschedule →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ==================== GOALS ==================== */}
      {goals.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Goals
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {goals.filter((g) => g.status === 'completed').length}/{goals.length} done
            </span>
          </div>
          <div className="space-y-2">
            {(expandGoals ? goals : goals.slice(0, 3)).map((g, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {g.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <p
                  className={`flex-1 ${g.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                >
                  {g.title}
                </p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    g.priority === 'high'
                      ? 'bg-destructive/10 text-destructive'
                      : g.priority === 'low'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-warning/10 text-warning'
                  }`}
                >
                  {g.priority}
                </span>
              </div>
            ))}
            {goals.length > 3 && (
              <button
                onClick={() => setExpandGoals((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${expandGoals ? 'rotate-180' : ''}`}
                />
                {expandGoals ? 'Show less' : `+${goals.length - 3} more goals`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== MILESTONES ==================== */}
      {milestones.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Upcoming Milestones
            </h3>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, 3).map((m, i) => {
              const days = daysUntil(m.targetDate)
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-input text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                      days <= 7
                        ? 'bg-destructive/10 text-destructive'
                        : days <= 30
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {days <= 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
