'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  UserCircle,
  Crown,
  Calendar,
  TestTube,
  Video,
  Check,
  Circle,
  ChevronDown,
} from 'lucide-react'
import type { User } from '@/payload-types'

interface GettingStartedChecklistProps {
  user: User
  subscriptionActive: boolean
  hasStudyPlan: boolean
  testsCompleted: number
  hasWatchedVideo: boolean
  userId: string
}

interface ChecklistItem {
  label: string
  done: boolean
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export default function GettingStartedChecklist({
  user,
  subscriptionActive,
  hasStudyPlan,
  testsCompleted,
  hasWatchedVideo,
  userId,
}: GettingStartedChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  const items: ChecklistItem[] = [
    {
      label: 'Create your account',
      done: true, // always done if they're seeing this
      href: '/dashboard',
      icon: Check,
    },
    {
      label: 'Complete your profile',
      done: Boolean(user.academicLevel && user.phoneNumber),
      href: '/dashboard/account',
      icon: UserCircle,
    },
    {
      label: 'Subscribe to unlock content',
      done: subscriptionActive,
      href: '/dashboard/subscriptions',
      icon: Crown,
    },
    {
      label: 'Create your first study plan',
      done: hasStudyPlan,
      href: '/dashboard/planner',
      icon: Calendar,
    },
    {
      label: 'Take your first practice test',
      done: testsCompleted > 0,
      href: '/dashboard/testing',
      icon: TestTube,
    },
    {
      label: 'Watch your first video lesson',
      done: hasWatchedVideo,
      href: '/dashboard/videos',
      icon: Video,
    },
  ]

  const completedCount = items.filter((i) => i.done).length
  const allDone = completedCount === items.length
  const progressPercent = Math.round((completedCount / items.length) * 100)

  // Auto-dismiss and mark onboarded when all done
  const markOnboarded = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarded: true }),
      })
      if (res.ok) setDismissed(true)
    } catch {
      // Silently fail — checklist will just remain visible
    }
  }, [userId])

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
      className="p-5 rounded-xl border bg-card border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Getting Started</h2>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{items.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-border mb-4">
        <motion.div
          className="h-2 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.done ? '#' : item.href}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                item.done
                  ? 'opacity-60 cursor-default'
                  : 'hover:bg-accent cursor-pointer'
              }`}
              onClick={(e) => item.done && e.preventDefault()}
            >
              {item.done ? (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span
                className={`text-sm ${
                  item.done
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* All done? */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-border text-center"
        >
          <p className="text-sm text-foreground mb-2">
            🎉 You&apos;re all set up! Great job!
          </p>
          <button
            onClick={markOnboarded}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Dismiss checklist
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
