'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  CheckCircle2,
  Wand2,
  RefreshCw,
  Save,
} from 'lucide-react'
import type { StudyPlan } from '@/payload-types'

// Derive the AI-returned plan shape directly from the Payload StudyPlan type,
// using only the fields the AI will populate (no Payload-internal fields like id, user, etc.)
export type GeneratedPlan = {
  goals: string
  planType: NonNullable<StudyPlan['planType']>
  targetExamDate?: string | null
  studyGoals?: NonNullable<StudyPlan['studyGoals']>
  weeklySchedule: NonNullable<StudyPlan['weeklySchedule']>
  milestones?: NonNullable<StudyPlan['milestones']>
  studyPreferences?: StudyPlan['studyPreferences']
  studyReminders?: NonNullable<StudyPlan['studyReminders']>
}

interface PlanPreviewCardProps {
  plan: GeneratedPlan
  subjectMap: Record<string, string> // id -> display name
  onApply: () => void
  onRegenerate: () => void
  saving?: boolean
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-destructive bg-destructive/10',
  medium: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-muted',
}

const SESSION_COLORS: Record<string, string> = {
  study: 'bg-primary/10 text-primary border-primary/20',
  revision: 'bg-secondary/10 text-secondary border-secondary/20',
  practice: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  test: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

export default function PlanPreviewCard({
  plan,
  subjectMap,
  onApply,
  onRegenerate,
  saving = false,
}: PlanPreviewCardProps) {
  const sortedSchedule = [...(plan.weeklySchedule ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  )

  const totalHoursPerWeek = sortedSchedule.reduce((acc, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return acc + (eh * 60 + em - (sh * 60 + sm)) / 60
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/5 border-b border-border/50 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground">AI-Generated Study Plan</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Goal banner */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">{plan.goals}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-input border border-border">
            <p className="text-lg font-bold text-foreground">{sortedSchedule.length}</p>
            <p className="text-xs text-muted-foreground">Sessions/wk</p>
          </div>
          <div className="p-2 rounded-lg bg-input border border-border">
            <p className="text-lg font-bold text-foreground">{totalHoursPerWeek.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Hours/wk</p>
          </div>
          <div className="p-2 rounded-lg bg-input border border-border">
            <p className="text-lg font-bold capitalize text-foreground">
              {plan.planType?.replace('_', ' ') ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">Plan type</p>
          </div>
        </div>

        {/* Weekly schedule */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Weekly Schedule
            </p>
          </div>
          <div className="space-y-1.5">
            {sortedSchedule.map((s, i) => {
              const subjectId =
                typeof s.subject === 'string' ? s.subject : ((s.subject as any)?.id ?? '')
              const subjectName = subjectMap[subjectId] ?? subjectId
              const colorClass = SESSION_COLORS[s.sessionType ?? 'study'] ?? SESSION_COLORS.study
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${colorClass}`}
                >
                  <span className="font-medium capitalize w-24 flex-shrink-0">{s.dayOfWeek}</span>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <Clock className="w-3 h-3" />
                    {s.startTime}–{s.endTime}
                  </div>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{subjectName}</span>
                  </div>
                  <span className="capitalize text-xs opacity-70 flex-shrink-0">
                    {s.sessionType}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Study goals — uses `title` matching the Payload StudyPlan schema */}
        {(plan.studyGoals?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Goals
              </p>
            </div>
            <div className="space-y-1.5">
              {(plan.studyGoals ?? []).map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 font-medium ${PRIORITY_COLORS[g.priority ?? 'medium'] ?? PRIORITY_COLORS.medium}`}
                  >
                    {g.priority ?? 'medium'}
                  </span>
                  <span className="text-foreground">{g.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {(plan.milestones?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Milestones
            </p>
            <div className="space-y-1.5">
              {(plan.milestones ?? []).slice(0, 3).map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{m.title}</p>
                    {m.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        By {new Date(m.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onApply}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Apply This Plan
              </>
            )}
          </button>
          <button
            onClick={onRegenerate}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>
      </div>
    </motion.div>
  )
}
