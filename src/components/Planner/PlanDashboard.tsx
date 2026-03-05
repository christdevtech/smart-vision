'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import type { StudyPlan, Subject } from '@/payload-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SessionLog = {
  date: string
  dayOfWeek: string
  sessionIndex: number
  status: 'completed' | 'missed' | 'rescheduled'
  note?: string | null
}
type WeeklySession = NonNullable<StudyPlan['weeklySchedule']>[number]
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
const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SESSION_COLORS: Record<string, string> = {
  study: 'bg-primary border-primary/30 text-primary',
  revision: 'bg-secondary border-secondary/30 text-secondary',
  practice: 'bg-emerald-500 border-emerald-500/30 text-emerald-600',
  test: 'bg-orange-500 border-orange-500/30 text-orange-600',
}
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

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayOfWeekKey(d: Date): string {
  return DAY_ORDER[d.getDay()]!
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------
function buildMonth(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array(startDay).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PlanDashboard({ plan, subjects, onAdjust }: PlanDashboardProps) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [logs, setLogs] = useState<SessionLog[]>(((plan as any).sessionLogs ?? []) as SessionLog[])
  const [logging, setLogging] = useState<string | null>(null) // sessionKey being saved
  const [expandGoals, setExpandGoals] = useState(false)

  const schedule = (plan.weeklySchedule ?? []) as WeeklySession[]
  const goals = (plan.studyGoals ?? []) as StudyGoal[]
  const milestones = ((plan.milestones ?? []) as Milestone[])
    .filter((m) => !m.isCompleted)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())

  // ------------ Log lookup helpers -----------------------------------------
  const logKey = (date: Date, sessionIdx: number) => `${toDateKey(date)}_${sessionIdx}`

  const logFor = useCallback(
    (date: Date, sessionIdx: number): SessionLog | undefined => {
      const dk = toDateKey(date)
      return logs.find((l) => {
        const ld = new Date(l.date)
        return toDateKey(ld) === dk && l.sessionIndex === sessionIdx
      })
    },
    [logs],
  )

  // ------------ Per-day sessions -------------------------------------------
  const sessionsForDay = useCallback(
    (date: Date): { session: WeeklySession; index: number }[] => {
      const dow = dayOfWeekKey(date)
      return schedule
        .map((s, i) => ({ session: s, index: i }))
        .filter(({ session }) => session.dayOfWeek === dow)
    },
    [schedule],
  )

  // ------------ Calendar dot indicators ------------------------------------
  const calendarDots = useCallback(
    (date: Date): string[] => {
      return sessionsForDay(date).map(({ session }) => session.sessionType ?? 'study')
    },
    [sessionsForDay],
  )

  // ------------ Day tint (past day green/red) --------------------------------
  const dayTint = useCallback(
    (date: Date): 'none' | 'green' | 'red' | 'partial' => {
      const dayKey = toDateKey(date)
      const todayKey = toDateKey(today)
      if (dayKey >= todayKey) return 'none'
      const daySessions = sessionsForDay(date)
      if (daySessions.length === 0) return 'none'
      const dayLogs = daySessions.map(({ index }) => logFor(date, index))
      const completed = dayLogs.filter((l) => l?.status === 'completed').length
      if (completed === daySessions.length) return 'green'
      if (completed === 0) return 'red'
      return 'partial'
    },
    [sessionsForDay, logFor, today],
  )

  // ------------ Progress stats ---------------------------------------------
  const progress = plan.progress ?? 0
  const streak = (plan as any).analytics?.currentStreak ?? 0
  const weeklyRate = (plan as any).analytics?.weeklyCompletionRate ?? 0
  const weekSessions = schedule.length
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekDone = logs.filter(
    (l) => new Date(l.date) >= weekStart && l.status === 'completed',
  ).length
  const missedThisWeek = logs.filter(
    (l) => new Date(l.date) >= weekStart && l.status === 'missed',
  ).length

  // ------------ Session logging call ---------------------------------------
  async function logSession(date: Date, sessionIdx: number, status: 'completed' | 'missed') {
    const key = logKey(date, sessionIdx)
    setLogging(key)
    const dow = dayOfWeekKey(date)
    try {
      const resp = await fetch('/api/custom/study-plans/log-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          dayOfWeek: dow,
          sessionIndex: sessionIdx,
          status,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const newLogs = ((data.plan as any)?.sessionLogs ?? []) as SessionLog[]
        setLogs(newLogs)
      }
    } finally {
      setLogging(null)
    }
  }

  // ------------ Calendar navigation ----------------------------------------
  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1)
      setCalMonth(11)
    } else setCalMonth((m) => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1)
      setCalMonth(0)
    } else setCalMonth((m) => m + 1)
  }

  const weeks = buildMonth(calYear, calMonth)
  const isToday = (d: Date | null) => d && toDateKey(d) === toDateKey(today)
  const isSelected = (d: Date | null) => d && toDateKey(d) === toDateKey(selectedDate)
  const selectedSessions = sessionsForDay(selectedDate)

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
            {weekDone}/{weekSessions}
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

      {/* ==================== CALENDAR ==================== */}
      <div className="rounded-2xl border border-border bg-input overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-semibold text-foreground">
            {MONTH_NAMES[calMonth]} {calYear}
          </p>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((date, di) => {
                if (!date) return <div key={di} className="p-1 min-h-[52px]" />
                const dots = calendarDots(date)
                const tint = dayTint(date)
                const todayCell = isToday(date)
                const selectedCell = isSelected(date)
                return (
                  <button
                    key={di}
                    onClick={() => {
                      setSelectedDate(date)
                      setCalYear(date.getFullYear())
                      setCalMonth(date.getMonth())
                    }}
                    className={`relative p-1 min-h-[52px] flex flex-col items-center transition-colors border border-transparent
                      ${selectedCell ? 'bg-primary/15 border-primary/30' : 'hover:bg-accent'}
                      ${tint === 'green' && !selectedCell ? 'bg-emerald-500/5' : ''}
                      ${tint === 'red' && !selectedCell ? 'bg-destructive/5' : ''}
                      ${tint === 'partial' && !selectedCell ? 'bg-warning/5' : ''}
                    `}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                      ${todayCell ? 'bg-primary text-primary-foreground' : 'text-foreground'}
                    `}
                    >
                      {date.getDate()}
                    </span>
                    {/* Session dots */}
                    {dots.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]">
                        {dots.slice(0, 3).map((type, i) => {
                          const color =
                            type === 'study'
                              ? 'bg-primary'
                              : type === 'revision'
                                ? 'bg-secondary'
                                : type === 'practice'
                                  ? 'bg-emerald-500'
                                  : 'bg-orange-500'
                          return <div key={i} className={`w-1.5 h-1.5 rounded-full ${color}/70`} />
                        })}
                        {dots.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
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
          <p className="text-sm font-semibold text-foreground mb-3">
            {selectedDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>

          {selectedSessions.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-input text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              No sessions scheduled — enjoy your rest day! 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map(({ session, index }) => {
                const log = logFor(selectedDate, index)
                const isPast = selectedDate <= today
                const key = logKey(selectedDate, index)
                const isLogging = logging === key
                const colorClass = SESSION_BG[session.sessionType ?? 'study'] ?? SESSION_BG.study
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${colorClass}`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {log?.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {log?.status === 'missed' && <XCircle className="w-5 h-5 text-destructive" />}
                      {log?.status === 'rescheduled' && (
                        <CalendarDays className="w-5 h-5 text-warning" />
                      )}
                      {!log && <Circle className="w-5 h-5 opacity-50" />}
                    </div>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {subjectName(session.subject, subjects)}
                        </span>
                        <span className="capitalize text-xs opacity-70 flex-shrink-0">
                          {session.sessionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {fmt12(session.startTime)} – {fmt12(session.endTime)}
                      </div>
                    </div>

                    {/* Actions */}
                    {isPast && !log && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          disabled={isLogging}
                          onClick={() => logSession(selectedDate, index, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {isLogging ? '…' : 'Done ✓'}
                        </button>
                        <button
                          disabled={isLogging}
                          onClick={() => logSession(selectedDate, index, 'missed')}
                          className="px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30 transition-colors disabled:opacity-50"
                        >
                          {isLogging ? '…' : 'Missed ✕'}
                        </button>
                      </div>
                    )}
                    {log?.status === 'missed' && (
                      <button
                        onClick={() =>
                          onAdjust(
                            `I missed my ${subjectName(session.subject, subjects)} ${session.sessionType} session on ${selectedDate.toLocaleDateString('en-GB')}. Can you help me reschedule it?`,
                          )
                        }
                        className="flex-shrink-0 text-xs text-destructive underline underline-offset-2 hover:no-underline"
                      >
                        Reschedule →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ==================== GOALS ==================== */}
      {goals.length > 0 && (
        <div>
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
        <div>
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
