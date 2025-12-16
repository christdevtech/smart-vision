import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { FileQuestion } from 'lucide-react'
import QuestionBankClient from '@/components/QuestionBank/Client'
import { AcademicLevel } from '@/payload-types'

export default async function QuestionBankPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const [levelsRes, subjectsRes, topicsRes] = await Promise.all([
    payload.find({ collection: 'academicLevels', limit: 200 }),
    payload.find({ collection: 'subjects', limit: 200 }),
    payload.find({ collection: 'topics', limit: 500 }),
  ])
  const levels = (levelsRes.docs || []) as AcademicLevel[]

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
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Comprehensive Question Bank</h1>
                  <p className="text-lg text-muted-foreground">
                    Browse and practice with curated questions. Offline access requires subscription.
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <QuestionBankClient
              academicLevels={levels}
              subjects={subjectsRes.docs as any}
              topics={topicsRes.docs as any}
            />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
