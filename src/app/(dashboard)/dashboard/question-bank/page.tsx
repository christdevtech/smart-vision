import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { FileQuestion } from 'lucide-react'
import QuestionBankClient from '@/components/QuestionBank/Client'
import { Subscription } from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'

export default async function QuestionBankPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Global Context: Enforce Academic Level
  const userLevelId = typeof user.academicLevel === 'object' ? user.academicLevel?.id : user.academicLevel
  if (!userLevelId) {
    redirect('/dashboard/account?setup=level')
  }

  const [subjectsRes, papersRes, subsRes] = await Promise.all([
    // TODO: Ideally filter subjects to only those that have papers for this level, but for now we'll fetch all
    payload.find({ collection: 'subjects', where: { academicLevels: { in: [userLevelId] } }, limit: 200 }),
    payload.find({
      collection: 'exam-papers',
      where: {
        and: [
          { isActive: { equals: true } },
          { academicLevel: { equals: userLevelId } },
        ],
      },
      limit: 500,
      depth: 2, // Populate subject, thumbnail, pdf, answerKeyPdf
      sort: 'subject',
    }),
    payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      limit: 1,
    }),
  ])

  const subs = subsRes.docs?.[0] as Subscription | undefined
  const subscriptionActive = isSubscriptionActive(subs)

  return (
    <DashboardLayout user={user} title="Question Bank">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <FileQuestion className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Question Bank</h1>
                  <p className="text-lg text-muted-foreground">
                    Browse exam papers by subject and paper number
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <QuestionBankClient
              examPapers={papersRes.docs as any}
              subjects={subjectsRes.docs as any}
              user={user as any}
              subscriptionActive={subscriptionActive}
            />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
