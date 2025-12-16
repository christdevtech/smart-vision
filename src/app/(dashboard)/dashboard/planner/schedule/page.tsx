import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Calendar } from 'lucide-react'
import { StudyPlan } from '@/payload-types'

export default async function PlannerSchedulePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const res = await payload.find({
    collection: 'study-plans',
    where: { user: { equals: user.id } },
    limit: 5,
  })
  const plans = res.docs as StudyPlan[]
  const plan = plans.find((p) => p.isActive) || plans[0] || null

  return (
    <DashboardLayout user={user} title="Study Schedule">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Schedule</h1>
                  <p className="text-lg text-muted-foreground">Manage study sessions</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
              {!plan ? (
                <p className="text-muted-foreground">
                  No active study plan. Create one to see your schedule.
                </p>
              ) : (
                <>
                  <div className="p-3 rounded-lg border bg-input border-border">
                    <p className="font-medium text-foreground">Weekly Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      {(plan as any).planType || 'regular_study'} • Progress {plan.progress || 0}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(plan.weeklySchedule || []).map((s) => (
                      <div
                        key={s.id || `${s.dayOfWeek}-${s.startTime}`}
                        className="p-3 rounded-lg border bg-input border-border"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {s.dayOfWeek} • {s.startTime}–{s.endTime}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(typeof s.subject === 'string' ? s.subject : (s.subject as any)?.name) ||
                            'Subject'}{' '}
                          • {s.sessionType || 'study'}
                        </p>
                      </div>
                    ))}
                    {!(plan.weeklySchedule || []).length && (
                      <div className="p-3 rounded-lg border bg-input border-border">
                        <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
