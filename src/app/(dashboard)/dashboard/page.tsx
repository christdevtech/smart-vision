import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import Link from 'next/link'
import {
  User,
  BookOpen,
  TestTube,
  Video,
  Library,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  CreditCard,
} from 'lucide-react'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import ScrollReveal from '@/components/Dashboard/ScrollReveal'
import { getSubscriptionCosts } from '@/utilities/subscription'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch subscription data
  const subscriptionData = await getSubscriptionCosts(payload)

  // Fetch user's subscription and transactions
  const subscriptionDocs = await payload.find({
    collection: 'subscriptions',
    where: {
      user: {
        equals: user.id,
      },
    },
    limit: 1,
    sort: '-createdAt',
  })

  const transactionDocs = await payload.find({
    collection: 'transactions',
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  const transactions = transactionDocs.docs
  const subscription = subscriptionDocs.docs[0] || null

  const filledProfileFields = [
    Boolean(user.phoneNumber),
    Boolean(user.dateOfBirth),
    Boolean(user.academicLevel),
    Boolean(user.profilePic),
  ].filter(Boolean).length
  const accountCompletion = Math.round((filledProfileFields / 4) * 100)
  const now = new Date().toISOString()
  const subscriptionActive = Boolean(
    subscription &&
      subscription.paymentStatus === 'paid' &&
      subscription.endDate &&
      subscription.endDate > now,
  )

  return (
    <DashboardLayout user={user} title="Dashboard">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Welcome Section */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    Welcome back, {user.firstName || 'User'}! 👋
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Ready to continue your learning journey? Let us make today productive.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="flex justify-center items-center w-20 h-20 bg-gradient-to-br rounded-full from-primary to-secondary">
                    <span className="text-3xl">🎓</span>
                  </div>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Stats Overview */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Total Referrals',
                  value: user.totalReferrals || 0,
                  icon: Users,
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-500/10',
                },
                {
                  title: 'Learning Progress',
                  value: '75%',
                  icon: TrendingUp,
                  color: 'text-green-500',
                  bgColor: 'bg-green-500/10',
                },
                {
                  title: 'Tests Completed',
                  value: '12',
                  icon: TestTube,
                  color: 'text-purple-500',
                  bgColor: 'bg-purple-500/10',
                },
                {
                  title: 'Study Streak',
                  value: '7 days',
                  icon: Calendar,
                  color: 'text-orange-500',
                  bgColor: 'bg-orange-500/10',
                },
              ].map((stat, index) => (
                <MotionWrapper key={stat.title} animation="scale" delay={0.1 * index}>
                  <div className="p-6 rounded-xl border transition-all duration-300 bg-card border-border hover:shadow-lg hover:border-primary/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                </MotionWrapper>
              ))}
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
            <ScrollReveal direction="up" delay={0.2}>
              <MotionWrapper animation="scale" className="h-full">
                <div className="p-6 rounded-xl border transition-all duration-300 bg-card border-border hover:shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Setup</p>
                        <p className="font-semibold text-foreground">
                          {accountCompletion}% Complete
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/account"
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Manage
                    </Link>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${accountCompletion}%` }}
                    />
                  </div>
                </div>
              </MotionWrapper>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <MotionWrapper animation="scale" className="h-full">
                <div className="p-6 rounded-xl border transition-all duration-300 bg-card border-border hover:shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-3 items-center">
                      <div className="p-3 rounded-lg bg-success/10">
                        <CreditCard className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Subscription</p>
                        <p className="font-semibold text-foreground">
                          {subscriptionActive
                            ? `${subscription?.plan?.[0]?.toUpperCase() + subscription?.plan?.slice(1)}`
                            : 'No active subscription'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/subscriptions"
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      {subscriptionActive ? 'View' : 'Subscribe'}
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionActive
                      ? `Active until ${new Date(subscription!.endDate).toLocaleDateString('en-US')}`
                      : 'Subscribe to access premium content'}
                  </p>
                </div>
              </MotionWrapper>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <MotionWrapper animation="scale" className="h-full">
                <div className="p-6 rounded-xl border transition-all duration-300 bg-card border-border hover:shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-3 items-center">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Referrals</p>
                        <p className="font-semibold text-foreground">
                          {user.totalReferrals || 0} total
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/referrals"
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      View
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">Invite friends and earn rewards</p>
                </div>
              </MotionWrapper>
            </ScrollReveal>
          </div>
          {/* Quick Actions */}
          <ScrollReveal direction="up" delay={0.3}>
            <div className="p-6 rounded-xl border bg-card border-border">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    title: 'Study Materials',
                    icon: BookOpen,
                    href: '/study',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                  },
                  {
                    title: 'Practice Tests',
                    icon: TestTube,
                    href: '/tests',
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-500/10',
                  },
                  {
                    title: 'Video Lessons',
                    icon: Video,
                    href: '/videos',
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                  },
                  {
                    title: 'Library',
                    icon: Library,
                    href: '/library',
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                  },
                ].map((action, index) => (
                  <MotionWrapper key={action.title} animation="scale" delay={0.1 * index}>
                    <Link
                      href={action.href}
                      className="flex flex-col items-center p-4 rounded-lg border transition-all duration-300 group border-border hover:border-primary/30 hover:shadow-md"
                    >
                      <div
                        className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <span className="mt-2 text-sm font-medium text-center text-foreground">
                        {action.title}
                      </span>
                    </Link>
                  </MotionWrapper>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </DashboardLayout>
  )
}
