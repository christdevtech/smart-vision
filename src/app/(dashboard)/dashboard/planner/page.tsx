import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Calendar } from 'lucide-react'
import PlannerForm from '@/components/Planner/PlannerForm'

export default async function StudyPlannerPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const academicLevels = await payload.find({ collection: 'academicLevels', limit: 100 })
  const subjects = await payload.find({ collection: 'subjects', limit: 100 })
  const topics = await payload.find({ collection: 'topics', limit: 100 })

  const existingPlan = await payload.find({
    collection: 'study-plans',
    where: { user: { equals: user.id } },
    limit: 1,
  })

  const initialPlan = existingPlan.docs[0] || null

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
                    Plan your study schedule, set goals, and track deadlines
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              <PlannerForm
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