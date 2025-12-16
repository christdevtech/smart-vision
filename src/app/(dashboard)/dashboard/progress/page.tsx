import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { BarChart3 } from 'lucide-react'
import { TestResult, UserProgress } from '@/payload-types'

export default async function ProgressTrackingPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const [progressRes, resultsRes] = await Promise.all([
    payload.find({ collection: 'user-progress', where: { user: { equals: user.id } }, limit: 500 }),
    payload.find({ collection: 'test-results', where: { user: { equals: user.id } }, limit: 50 }),
  ])
  const progresses = (progressRes.docs || []) as UserProgress[]
  const results = (resultsRes.docs || []) as TestResult[]

  const totalTime = progresses.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
  const completedCount = progresses.filter((p) => p.completed).length
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.scorePercentage || 0), 0) / results.length)
      : null
  const streak = Math.max(...progresses.map((p) => p.studyStreak || 0), 0)

  return (
    <DashboardLayout user={user} title="Progress Tracking">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Progress Tracking</h1>
                  <p className="text-lg text-muted-foreground">
                    Monitor your learning progress, achievements, and performance analytics
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Total Time Spent</p>
                  <p className="text-2xl font-bold">{totalTime} min</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Completed Items</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Average Test Score</p>
                  <p className="text-2xl font-bold">{averageScore !== null ? `${averageScore}%` : '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Study Streak</p>
                  <p className="text-2xl font-bold">{streak} days</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Recent Test Results</p>
                {results.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border bg-input border-border">
                    <p className="text-sm">
                      {typeof r.subject === 'string' ? r.subject : (r.subject as any)?.name || 'Subject'} •{' '}
                      {r.testType} • {r.scorePercentage}% • {new Date(r.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {!results.length && (
                  <div className="p-3 rounded-lg border bg-input border-border">
                    <p className="text-sm text-muted-foreground">No test results yet.</p>
                  </div>
                )}
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
