'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bell,
  ArrowRight,
  BookOpen,
  Trophy,
  CreditCard,
  Calendar,
  Info,
} from 'lucide-react'
import type { Notification } from '@/payload-types'

interface NotificationsPreviewProps {
  notifications: Notification[]
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reminder: Calendar,
  study_plan: Calendar,
  achievement: Trophy,
  subscription: CreditCard,
  payment: CreditCard,
  content: BookOpen,
  test_result: Trophy,
  referral: Info,
  system: Info,
  general: Bell,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function NotificationsPreview({
  notifications,
}: NotificationsPreviewProps) {
  if (notifications.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
      className="p-5 rounded-xl border bg-card border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
        </div>
        <Link
          href="/dashboard/notifications"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const type = n.type ?? 'system'
          const Icon = TYPE_ICONS[type] ?? Bell

          return (
            <Link
              key={n.id}
              href={n.actionLink ?? '/dashboard/notifications'}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-muted-foreground truncate">
                    {n.message}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {timeAgo(n.createdAt)}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
