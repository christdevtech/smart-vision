'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  UserCircle,
  Crown,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { User, StudyPlan, UserProgress, Subject } from '@/payload-types'

interface SmartWelcomeBannerProps {
  user: User
  subscriptionActive: boolean
  studyPlan: StudyPlan | null
  recentProgress: UserProgress | null
}

function getNextSession(studyPlan: StudyPlan | null) {
  if (!studyPlan?.timetable) return null
  const now = new Date()
  const todaySessions = studyPlan.timetable
    .filter((s) => {
      const sessionDate = new Date(s.date)
      return (
        sessionDate.toDateString() === now.toDateString() &&
        s.status === 'pending'
      )
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return todaySessions[0] ?? null
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject) return 'Study'
  if (typeof subject === 'string') return 'Study'
  return subject.name ?? 'Study'
}

export default function SmartWelcomeBanner({
  user,
  subscriptionActive,
  studyPlan,
  recentProgress,
}: SmartWelcomeBannerProps) {
  const profileComplete = Boolean(user.academicLevel && user.phoneNumber)
  const nextSession = getNextSession(studyPlan)

  // Determine the best message + CTA based on user state
  let message: string
  let cta: { label: string; href: string; icon: React.ReactNode } | null = null
  let emoji = '👋'

  if (!profileComplete) {
    message = "Let's set up your profile so we can recommend the right content for your level."
    cta = {
      label: 'Complete Profile',
      href: '/dashboard/account',
      icon: <UserCircle className="w-4 h-4" />,
    }
    emoji = '🎯'
  } else if (!subscriptionActive) {
    message =
      'Subscribe to unlock all study materials, video lessons, and practice tests.'
    cta = {
      label: 'View Plans',
      href: '/dashboard/subscriptions',
      icon: <Crown className="w-4 h-4" />,
    }
    emoji = '💎'
  } else if (!studyPlan) {
    message =
      "You have full access! Create a personalised study plan to stay on track."
    cta = {
      label: 'Create Study Plan',
      href: '/dashboard/planner',
      icon: <Calendar className="w-4 h-4" />,
    }
    emoji = '📅'
  } else if (nextSession) {
    const subjectName = getSubjectName(nextSession.subject)
    message = `Your next session is ${subjectName} at ${nextSession.startTime}. Ready to prepare?`
    cta = {
      label: 'Go to Planner',
      href: '/dashboard/planner',
      icon: <Sparkles className="w-4 h-4" />,
    }
    emoji = '📚'
  } else if (recentProgress) {
    const contentLabel =
      recentProgress.contentType === 'video'
        ? 'video lesson'
        : recentProgress.contentType === 'book'
          ? 'reading'
          : recentProgress.contentType === 'mcq'
            ? 'practice test'
            : 'session'
    message = `Welcome back! Continue your ${contentLabel} — you're ${recentProgress.progressPercentage ?? 0}% through.`
    cta = {
      label: 'Continue Learning',
      href: `/dashboard/${recentProgress.contentType === 'video' ? 'videos' : recentProgress.contentType === 'book' ? 'library' : 'testing'}`,
      icon: <BookOpen className="w-4 h-4" />,
    }
    emoji = '🚀'
  } else {
    message = "Ready to continue your learning journey? Let's make today productive."
    emoji = '🎓'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50"
    >
      <div className="flex justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl text-foreground">
            Welcome back, {user.firstName || 'User'}! {emoji}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">{message}</p>

          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {cta.icon}
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="hidden md:block flex-shrink-0">
          <div className="flex justify-center items-center w-20 h-20 bg-gradient-to-br rounded-full from-primary to-secondary">
            <span className="text-3xl">{emoji}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
