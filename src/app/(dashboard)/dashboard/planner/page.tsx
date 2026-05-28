import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Calendar } from 'lucide-react'
import PlannerClient from '@/components/Planner/PlannerClient'
import { unrollTimetable, computeEndDate } from '@/utilities/unrollTimetable'

export default async function StudyPlannerPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const [academicLevels, subjects, topics, existingPlan] = await Promise.all([
    payload.find({ collection: 'academicLevels', limit: 100 }),
    payload.find({ collection: 'subjects', limit: 100 }),
    payload.find({ collection: 'topics', limit: 100 }),
    payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 2,
    }),
  ])

  let initialPlan = existingPlan.docs[0] ?? null

  // Auto-extend expired timetables: if the plan is active, has a weekly
  // schedule template, but all timetable sessions are in the past, re-unroll
  // from today for another 12 weeks (preserving historical entries).
  if (initialPlan?.isActive && (initialPlan.weeklySchedule?.length ?? 0) > 0) {
    const timetable = (initialPlan.timetable ?? []) as any[]
    const hasFutureSessions = timetable.some((s: any) => new Date(s.date) >= new Date())

    if (!hasFutureSessions) {
      const startDate = new Date()
      startDate.setUTCHours(0, 0, 0, 0)
      const endDate = computeEndDate(
        startDate,
        initialPlan.planType ?? null,
        (initialPlan as any).targetExamDate ?? null,
      )

      const newTimetable = unrollTimetable({
        weeklySchedule: initialPlan.weeklySchedule as any[],
        startDate,
        endDate,
        existingPastSessions: timetable,
      })

      const updated = await payload.update({
        collection: 'study-plans',
        id: initialPlan.id,
        data: { timetable: newTimetable as any },
        depth: 2,
        context: { skipReminderGeneration: true },
      })

      initialPlan = updated
    }
  }

  return (
    <DashboardLayout user={user} title="Study Planner">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Study Planner</h1>
                  <p className="text-lg text-muted-foreground">
                    Your AI-powered personalised study schedule
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              <PlannerClient
                userId={user.id}
                academicLevels={academicLevels.docs as any}
                subjects={subjects.docs as any}
                topics={topics.docs as any}
                initialPlan={initialPlan as any}
              />
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
