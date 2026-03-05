'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  Trophy,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  Bell,
  Play,
} from 'lucide-react'
import type { StudyPlan, Subject } from '@/payload-types'

interface PlanDashboardProps {
  plan: StudyPlan
  subjects: Subject[]
  onAdjust: () => void
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TODAY_KEY = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

const SESSION_COLORS: Record<string, string> = {
  study: 'bg-primary/10 text-primary border-primary/20',
  revision: 'bg-secondary/10 text-secondary border-secondary/20',
  practice: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  test: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
}

function subjectName(subjectId: string | Subject | null | undefined, subjects: Subject[]): string {
  if (!subjectId) return '—'
  if (typeof subjectId === 'object') return (subjectId as any).name ?? '—'
  return subjects.find((s) => s.id === subjectId)?.name ?? subjectId
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function PlanDashboard({ plan, subjects, onAdjust }: PlanDashboardProps) {
  const [expandGoals, setExpandGoals] = useState(false)

  const schedule = (plan.weeklySchedule ?? []) as NonNullable<StudyPlan['weeklySchedule']>
  const todaySessions = schedule.filter((s) => s.dayOfWeek === TODAY_KEY)
  const goals = (plan.studyGoals ?? []) as NonNullable<StudyPlan['studyGoals']>
  const milestones = ((plan.milestones ?? []) as NonNullable<StudyPlan['milestones']>)
    .filter((m) => !m.isCompleted)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())

  const completedGoals = goals.filter((g) => g.status === 'completed').length
  const goalProgress = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Study Plan</h2>
          <p className="text-sm text-muted-foreground">{plan.goals ?? 'Active study plan'}</p>
        </div>
        <button
          onClick={onAdjust}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-input hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Adjust Plan
        </button>
      </div>

      {/* Today's sessions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Today —{' '}
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </h3>
        </div>

        {todaySessions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-input text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            No sessions scheduled for today — a rest day! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s, i) => {
              const color = SESSION_COLORS[s.sessionType ?? 'study'] ?? SESSION_COLORS.study
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border text-sm ${color}`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium truncate">{subjectName(s.subject, subjects)}</span>
                  </div>
                  <span className="capitalize text-xs opacity-70 flex-shrink-0">
                    {s.sessionType}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Week grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            This Week
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_ORDER.map((day) => {
            const daySessions = schedule.filter((s) => s.dayOfWeek === day)
            const isToday = day === TODAY_KEY
            return (
              <div
                key={day}
                className={`rounded-lg p-2 text-center ${isToday ? 'bg-primary/10 border border-primary/30' : 'bg-input border border-border'}`}
              >
                <p
                  className={`text-xs font-medium mb-1.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {DAY_LABELS[day]}
                </p>
                <div className="space-y-1">
                  {daySessions.length === 0 ? (
                    <div className="w-full h-1.5 rounded-full bg-muted/50" />
                  ) : (
                    daySessions.slice(0, 3).map((s, i) => {
                      const baseColor =
                        s.sessionType === 'study'
                          ? 'bg-primary'
                          : s.sessionType === 'revision'
                            ? 'bg-secondary'
                            : s.sessionType === 'practice'
                              ? 'bg-emerald-500'
                              : 'bg-orange-500'
                      return <div key={i} className={`w-full h-1.5 rounded-full ${baseColor}/60`} />
                    })
                  )}
                  {daySessions.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{daySessions.length - 3}</p>
                  )}
                </div>
                {daySessions.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {daySessions.length} session{daySessions.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Goals */}
      {goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Goals
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{goalProgress}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {(expandGoals ? goals : goals.slice(0, 3)).map((g, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                {g.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${g.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  >
                    {g.title}
                  </p>
                  {g.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      Due{' '}
                      {new Date(g.targetDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
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
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${expandGoals ? 'rotate-90' : ''}`}
                />
                {expandGoals ? 'Show less' : `+${goals.length - 3} more goals`}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
                  <div
                    className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                      days <= 7
                        ? 'bg-destructive/10 text-destructive'
                        : days <= 30
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {days <= 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Study preferences summary */}
      {plan.studyPreferences && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Preferences
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {plan.studyPreferences.sessionDuration != null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input">
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">
                  {plan.studyPreferences.sessionDuration} min sessions
                </span>
              </div>
            )}
            {plan.studyPreferences.breakDuration != null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input">
                <Bell className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">
                  {plan.studyPreferences.breakDuration} min breaks
                </span>
              </div>
            )}
            {plan.studyPreferences.preferredStudyTime && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input col-span-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground capitalize">
                  Prefers {plan.studyPreferences.preferredStudyTime.replace('_', ' ')} study
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
