import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import { getSubscriptionCosts } from '@/utilities/subscription'
import type { Video, Book } from '@/payload-types'

// Dashboard sections
import SmartWelcomeBanner from '@/components/Dashboard/SmartWelcomeBanner'
import GettingStartedChecklist from '@/components/Dashboard/GettingStartedChecklist'
import TodaysFocusPanel from '@/components/Dashboard/TodaysFocusPanel'
import ContinueLearning from '@/components/Dashboard/ContinueLearning'
import DiscoverContent from '@/components/Dashboard/DiscoverContent'
import SubscriptionCard from '@/components/Dashboard/SubscriptionCard'
import PerformanceSnapshot from '@/components/Dashboard/PerformanceSnapshot'
import NotificationsPreview from '@/components/Dashboard/NotificationsPreview'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // ---------- DATA FETCHING (all in parallel where possible) ----------

  const [
    subscriptionData,
    subscriptionDocs,
    testsResults,
    userProgress,
    studyPlanDocs,
    unreadNotifications,
  ] = await Promise.all([
    // Subscription costs from global settings
    getSubscriptionCosts(payload),

    // User's subscription
    payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      limit: 1,
      sort: '-createdAt',
    }),

    // Test results (with subject populated for PerformanceSnapshot)
    payload.find({
      collection: 'test-results',
      where: {
        user: { equals: user.id },
        isCompleted: { equals: true },
      },
      limit: 100,
      depth: 1,
    }),

    // User progress (most recent first, with subject populated)
    payload.find({
      collection: 'user-progress',
      where: { user: { equals: user.id } },
      limit: 100,
      sort: '-lastAccessed',
      depth: 1,
    }),

    // Active study plan
    payload.find({
      collection: 'study-plans',
      where: {
        user: { equals: user.id },
        isActive: { equals: true },
      },
      limit: 1,
      depth: 2, // Populate timetable[].subject with slug for deep linking
    }),

    // Unread notifications (last 3)
    payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: user.id },
        isRead: { equals: false },
      },
      sort: '-createdAt',
      limit: 3,
    }),
  ])

  // ---------- DERIVED DATA ----------

  const subscription = subscriptionDocs.docs[0] || null
  const now = new Date().toISOString()
  const subscriptionActive = Boolean(
    subscription &&
      subscription.paymentStatus === 'paid' &&
      subscription.endDate &&
      subscription.endDate > now,
  )

  const studyPlan = studyPlanDocs.docs[0] ?? null
  const testsCompleted = testsResults.totalDocs || testsResults.docs.length

  // Study streak: max across all user-progress entries
  const studyStreakDays = userProgress.docs
    .map((p) => (typeof p.studyStreak === 'number' ? p.studyStreak : 0))
    .reduce((max: number, val: number) => (val > max ? val : max), 0)

  // Has the user watched at least one video?
  const hasWatchedVideo = userProgress.docs.some((p) => p.contentType === 'video')

  // Latest content for new users (only fetch if no progress entries)
  let latestVideos: Video[] = []
  let latestBooks: Book[] = []

  if (userProgress.totalDocs === 0) {
    const [videosRes, booksRes] = await Promise.all([
      payload.find({ collection: 'videos', sort: '-createdAt', limit: 3, depth: 1 }),
      payload.find({ collection: 'books', sort: '-createdAt', limit: 3, depth: 1 }),
    ])
    latestVideos = videosRes.docs
    latestBooks = booksRes.docs
  }

  // ---------- RENDER ----------

  return (
    <DashboardLayout user={user} title="Dashboard">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-6">
          {/* 1. Smart Welcome Banner */}
          <SmartWelcomeBanner
            user={user}
            subscriptionActive={subscriptionActive}
            studyPlan={studyPlan}
            recentProgress={userProgress.docs[0] ?? null}
          />

          {/* 2. Getting Started Checklist (new users only) */}
          {!user.onboarded && (
            <GettingStartedChecklist
              user={user}
              subscriptionActive={subscriptionActive}
              hasStudyPlan={!!studyPlan}
              testsCompleted={testsCompleted}
              hasWatchedVideo={hasWatchedVideo}
              userId={user.id}
            />
          )}

          {/* 3. Today's Focus Panel */}
          <TodaysFocusPanel
            studyPlan={studyPlan}
            studyStreakDays={studyStreakDays}
            unreadCount={unreadNotifications.totalDocs}
          />

          {/* 4. Continue Where You Left Off / Discover Content */}
          {userProgress.totalDocs > 0 ? (
            <ContinueLearning recentProgress={userProgress.docs.slice(0, 3)} />
          ) : (
            <DiscoverContent
              latestVideos={latestVideos}
              latestBooks={latestBooks}
            />
          )}

          {/* 5. Subscription Card */}
          <SubscriptionCard
            subscriptionActive={subscriptionActive}
            subscription={subscription}
            subscriptionCosts={subscriptionData}
          />

          {/* 6. Performance Snapshot (only if has test results) */}
          {testsCompleted > 0 && (
            <PerformanceSnapshot testResults={testsResults.docs} />
          )}

          {/* 7. Notifications Preview */}
          {unreadNotifications.totalDocs > 0 && (
            <NotificationsPreview notifications={unreadNotifications.docs} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
