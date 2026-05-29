import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Play } from 'lucide-react'
import { Subject, Video, Subscription } from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'
import VideoClient from '@/components/VideoLibrary/VideoClient'

export default async function VideoLibraryPage() {
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

  const [vidsRes, subjectsRes, subsRes] = await Promise.all([
    payload.find({
      collection: 'videos',
      where: { academicLevel: { equals: userLevelId } },
      limit: 500,
      depth: 2,
    }),
    payload.find({
      collection: 'subjects',
      limit: 200,
    }),
    payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      limit: 1,
    }),
  ])

  const videos = vidsRes.docs as Video[]
  const subjects = subjectsRes.docs as Subject[]
  const subs = subsRes.docs?.[0] as Subscription | undefined
  const subscriptionActive = isSubscriptionActive(subs)

  return (
    <DashboardLayout user={user} title="Video Library">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Video Library</h1>
                  <p className="text-lg text-muted-foreground">
                    Watch educational videos, tutorials, and recorded lectures
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <VideoClient
              videos={videos}
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
