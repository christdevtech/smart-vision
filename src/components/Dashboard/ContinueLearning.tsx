'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Video, BookOpen, TestTube, FileText, ArrowRight } from 'lucide-react'
import type { UserProgress, Subject } from '@/payload-types'

interface ContinueLearningProps {
  recentProgress: UserProgress[]
}

const CONTENT_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; route: string; color: string }
> = {
  video: { icon: Video, label: 'Video', route: '/dashboard/videos', color: 'text-red-500 bg-red-500/10' },
  book: { icon: BookOpen, label: 'Book', route: '/dashboard/library', color: 'text-green-500 bg-green-500/10' },
  mcq: { icon: TestTube, label: 'Practice Test', route: '/dashboard/testing', color: 'text-purple-500 bg-purple-500/10' },
  'exam-paper': { icon: FileText, label: 'Exam Paper', route: '/dashboard/question-bank', color: 'text-indigo-500 bg-indigo-500/10' },
  'study-plan': { icon: BookOpen, label: 'Study Plan', route: '/dashboard/planner', color: 'text-orange-500 bg-orange-500/10' },
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject) return ''
  if (typeof subject === 'string') return ''
  return subject.name ?? ''
}

export default function ContinueLearning({ recentProgress }: ContinueLearningProps) {
  if (recentProgress.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Continue Where You Left Off</h2>
        <Link
          href="/dashboard/progress"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentProgress.map((p, i) => {
          const config = CONTENT_CONFIG[p.contentType] ?? CONTENT_CONFIG.book
          const Icon = config.icon
          const subjectName = getSubjectName(p.subject)
          const progress = typeof p.progressPercentage === 'number' ? p.progressPercentage : 0
          const isComplete = p.completed

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
            >
              <Link
                href={config.route}
                className="block p-4 rounded-xl border bg-card border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${config.color.split(' ')[1]} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {subjectName && (
                      <p className="text-sm font-semibold text-foreground truncate">
                        {subjectName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {isComplete ? 'Completed' : `${progress}% complete`}
                    </span>
                    {typeof p.score === 'number' && (
                      <span className="text-xs font-medium text-foreground">
                        Score: {p.score}%
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {isComplete && typeof p.score === 'number'
                    ? 'Review'
                    : 'Continue'}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
