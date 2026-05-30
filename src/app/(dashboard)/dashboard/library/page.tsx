import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Library } from 'lucide-react'
import { Subject, Book, Subscription } from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'
import LibraryClient from '@/components/Library/LibraryClient'

export default async function DigitalLibraryPage() {
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

  const [booksRes, subjectsRes, subsRes] = await Promise.all([
    payload.find({
      collection: 'books',
      where: { academicLevel: { equals: userLevelId } },
      limit: 500,
      depth: 2,
    }),
    payload.find({
      collection: 'subjects',
      where: { academicLevels: { in: [userLevelId] } },
      limit: 200,
    }),
    payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      limit: 1,
    }),
  ])

  const books = booksRes.docs as Book[]
  const subjects = subjectsRes.docs as Subject[]
  const subs = subsRes.docs?.[0] as Subscription | undefined
  const subscriptionActive = isSubscriptionActive(subs)

  return (
    <DashboardLayout user={user} title="Digital Library">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Library className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Digital Library</h1>
                  <p className="text-lg text-muted-foreground">
                    Access books, documents, research papers, and study materials
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <LibraryClient
              books={books}
              subjects={subjects}
              user={user as any}
              subscriptionActive={subscriptionActive}
            />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
