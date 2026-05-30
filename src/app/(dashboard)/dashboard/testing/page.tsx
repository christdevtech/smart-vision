import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { FileText } from 'lucide-react'
import { AcademicLevel, Subscription } from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'
import TestingCenterClient from '@/components/TestingCenter/Client'

export default async function TestingCenterPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  // Global Context: Enforce Academic Level
  const userLevelId = typeof user.academicLevel === 'object' ? user.academicLevel?.id : user.academicLevel
  if (!userLevelId) {
    redirect('/dashboard/account?setup=level')
  }

  return (
    <DashboardLayout user={user} title="Testing Center">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Testing Centre</h1>
                  <p className="text-lg text-muted-foreground">
                    Practice with multiple-choice questions to test your knowledge
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            {await (async () => {
              const [subjectsRes, topicsRes, subsRes] = await Promise.all([
                payload.find({ collection: 'subjects', where: { academicLevels: { in: [userLevelId] } }, limit: 200 }),
                payload.find({ collection: 'topics', limit: 500 }),
                payload.find({
                  collection: 'subscriptions',
                  where: { user: { equals: user.id } },
                  limit: 1,
                }),
              ])
              const subs = subsRes.docs?.[0] as Subscription | undefined
              const subscriptionActive = isSubscriptionActive(subs)
              return (
                <TestingCenterClient
                  user={user as any}
                  subscriptionActive={subscriptionActive}
                  subjects={subjectsRes.docs as any}
                  topics={topicsRes.docs as any}
                />
              )
            })()}
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
