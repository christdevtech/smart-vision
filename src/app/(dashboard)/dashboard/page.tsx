import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import Link from 'next/link'
import ReferralDashboard from '@/components/ReferralDashboard'
import SubscriptionDashboard from '@/components/SubscriptionDashboard'
import { Media } from '@/components/Media'
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

          {/* User Information Card */}
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
            <ScrollReveal direction="left" delay={0.2}>
              <div className="lg:col-span-1">
                <MotionWrapper animation="scale" className="h-full">
                  <div className="p-6 space-y-6 rounded-xl border transition-all duration-300 bg-dashboard-card border-border hover:bg-accent/50">
                    <div className="flex gap-4 items-center pb-4 border-b border-border">
                      <div className="relative w-16 h-16 rounded-full">
                        {user.profilePic ? (
                          <Media
                            fill
                            resource={user.profilePic}
                            imgClassName="object-cover rounded-full"
                          />
                        ) : (
                          <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 text-sm text-muted-foreground">Name</label>
                        <p className="text-foreground">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-muted-foreground">Email</label>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-muted-foreground">
                          Member Since
                        </label>
                        <p className="text-foreground">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {user.referredBy && (
                        <div>
                          <label className="block mb-1 text-sm text-muted-foreground">
                            Referred By
                          </label>
                          <p className="text-success">✓ Referred User</p>
                        </div>
                      )}
                    </div>
                  </div>
                </MotionWrapper>
              </div>
            </ScrollReveal>

            {/* Referral Dashboard */}
            <ScrollReveal direction="up" delay={0.5}>
              <ReferralDashboard />
            </ScrollReveal>

            {/* Subscription Dashboard */}
            <ScrollReveal direction="up" delay={0.6}>
              <SubscriptionDashboard
                user={user}
                subscriptionData={subscriptionData}
                subscription={subscription}
                transactions={transactions}
              />
            </ScrollReveal>
          </div>
        </div>
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

      {/* User Information Card */}
      <ScrollReveal direction="up" delay={0.4}>
        <div className="p-6 rounded-xl border bg-card border-border">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Account Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-12 h-12 rounded-full bg-blue-500/10">
                <User className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-12 h-12 rounded-full bg-green-500/10">
                <span className="text-lg font-medium text-green-500">@</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </DashboardLayout>
  )
}
