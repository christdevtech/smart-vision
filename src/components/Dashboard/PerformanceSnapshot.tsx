'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, ArrowRight, Lightbulb } from 'lucide-react'
import type { TestResult, Subject } from '@/payload-types'

interface PerformanceSnapshotProps {
  testResults: TestResult[]
}

interface SubjectScore {
  name: string
  avgScore: number
  count: number
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject) return 'Unknown'
  if (typeof subject === 'string') return 'Unknown'
  return subject.name ?? 'Unknown'
}

function getSubjectId(subject: string | Subject | null | undefined): string {
  if (!subject) return 'unknown'
  if (typeof subject === 'string') return subject
  return subject.id
}

export default function PerformanceSnapshot({ testResults }: PerformanceSnapshotProps) {
  if (testResults.length === 0) return null

  // Group by subject and compute averages
  const subjectMap = new Map<string, { name: string; scores: number[] }>()
  for (const result of testResults) {
    const id = getSubjectId(result.subject)
    const name = getSubjectName(result.subject)
    const entry = subjectMap.get(id) ?? { name, scores: [] }
    entry.scores.push(result.scorePercentage ?? 0)
    subjectMap.set(id, entry)
  }

  const subjectScores: SubjectScore[] = Array.from(subjectMap.values())
    .map((entry) => ({
      name: entry.name,
      avgScore: Math.round(
        entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
      ),
      count: entry.scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 4)

  const weakest = subjectScores[subjectScores.length - 1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
      className="p-5 rounded-xl border bg-card border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Your Performance</h2>
        </div>
        <Link
          href="/dashboard/progress"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          See All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {subjectScores.map((sub) => {
          const barColor =
            sub.avgScore >= 70
              ? 'bg-emerald-500'
              : sub.avgScore >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'

          return (
            <div key={sub.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{sub.name}</span>
                <span className="text-sm font-medium text-foreground">
                  {sub.avgScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-border">
                <motion.div
                  className={`h-2 rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${sub.avgScore}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Focus recommendation */}
      {weakest && weakest.avgScore < 70 && (
        <div className="flex items-start gap-2 mt-4 pt-3 border-t border-border">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Focus area:</span>{' '}
            {weakest.name} ({weakest.avgScore}%) —{' '}
            <Link href="/dashboard/testing" className="text-primary hover:text-primary/80">
              try a practice test
            </Link>
          </p>
        </div>
      )}
    </motion.div>
  )
}
