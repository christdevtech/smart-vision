'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Bell,
  Sparkles,
} from 'lucide-react'
import type { StudyPlan, Subject } from '@/payload-types'

interface TodaysFocusPanelProps {
  studyPlan: StudyPlan | null
  studyStreakDays: number
  unreadCount: number
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject) return 'Study'
  if (typeof subject === 'string') return 'Study'
  return subject.name ?? 'Study'
}

export default function TodaysFocusPanel({
  studyPlan,
  studyStreakDays,
  unreadCount,
}: TodaysFocusPanelProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const timetable = studyPlan?.timetable ?? []
  const todaySessions = timetable.filter(
    (s) => new Date(s.date).toDateString() === now.toDateString(),
  )
  const completedToday = todaySessions.filter(
    (s) => s.status === 'completed',
  ).length
  const pendingToday = todaySessions
    .filter((s) => s.status === 'pending')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const nextSession = pendingToday[0]

  const lines: { icon: React.ReactNode; text: string; href?: string }[] = []

  // Next session
  if (nextSession) {
    const subjectName = getSubjectName(nextSession.subject)
    lines.push({
      icon: <Clock className="w-4 h-4 text-primary" />,
      text: `Next session: ${subjectName} (${nextSession.startTime} – ${nextSession.endTime})`,
      href: '/dashboard/planner',
    })
  }

  // Sessions completed
  if (todaySessions.length > 0) {
    lines.push({
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      text: `${completedToday}/${todaySessions.length} sessions completed today`,
    })
  }

  // Streak
  if (studyStreakDays > 0) {
    lines.push({
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      text:
        studyStreakDays === 1
          ? '1-day streak! Keep it up!'
          : `${studyStreakDays}-day streak! Keep it up! 🔥`,
    })
  }

  // Unread notifications
  if (unreadCount > 0) {
    lines.push({
      icon: <Bell className="w-4 h-4 text-blue-500" />,
      text: `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`,
      href: '/dashboard/notifications',
    })
  }

  // Empty state: no plan or no sessions today
  if (todaySessions.length === 0 && !studyPlan) {
    lines.push({
      icon: <Sparkles className="w-4 h-4 text-muted-foreground" />,
      text: 'No sessions planned. Create a study plan to organize your week.',
      href: '/dashboard/planner',
    })
  } else if (todaySessions.length === 0 && studyPlan) {
    lines.push({
      icon: <CalendarDays className="w-4 h-4 text-muted-foreground" />,
      text: 'No sessions scheduled for today. Enjoy your free time!',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="p-5 rounded-xl border bg-card border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{dateStr}</h2>
      </div>

      <div className="space-y-2.5">
        {lines.map((line, i) => {
          const content = (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm ${
                line.href
                  ? 'text-foreground hover:text-primary transition-colors cursor-pointer'
                  : 'text-muted-foreground'
              }`}
            >
              {line.icon}
              <span>{line.text}</span>
            </div>
          )

          return line.href ? (
            <Link key={i} href={line.href}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={i}>{content}</React.Fragment>
          )
        })}
      </div>
    </motion.div>
  )
}
