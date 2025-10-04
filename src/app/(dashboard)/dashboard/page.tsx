import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import Link from 'next/link'
import ReferralDashboard from '@/components/ReferralDashboard'
import SubscriptionDashboard from '@/components/SubscriptionDashboard'
import { Media } from '@/components/Media'
import { User } from 'lucide-react'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import ScrollReveal from '@/components/Dashboard/ScrollReveal'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/')
  }
  const subscriptionDocs = await payload.find({
    collection: 'subscriptions',
    where: {
      user: {
        equals: user.id,
      },
    },
  })
  const transactionDocs = await payload.find({
    collection: 'transactions',
    where: {
      user: {
        equals: user.id,
      },
    },
  })
  const settings = await payload.findGlobal({
    slug: 'settings',
  })
  const transactions = transactionDocs.docs
  const subscription = subscriptionDocs.docs[0]

  return (
    <DashboardLayout user={user} title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <MotionWrapper animation="fadeIn" delay={0.1}>
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Welcome back, {user.firstName || 'User'}!
            </h1>
            <p className="text-white/60">Manage your account and track your referrals</p>
          </div>
        </MotionWrapper>

        {/* User Information Card */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          <ScrollReveal direction="left" delay={0.2}>
            <div className="lg:col-span-1">
              <MotionWrapper animation="scale" className="h-full">
                <div className="p-6 space-y-6 rounded-xl border bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300">
                  <div className="flex gap-4 items-center pb-4 border-b border-white/10">
                    <div className="relative w-16 h-16 rounded-full">
                      {user.profilePic ? (
                        <Media
                          fill
                          resource={user.profilePic}
                          imgClassName="object-cover rounded-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-sm text-white/60">Name</label>
                      <p className="text-white">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-white/60">Email</label>
                      <p className="text-white">{user.email}</p>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-white/60">Member Since</label>
                      <p className="text-white">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {user.referredBy && (
                      <div>
                        <label className="block mb-1 text-sm text-white/60">Referred By</label>
                        <p className="text-emerald-400">✓ Referred User</p>
                      </div>
                    )}
                  </div>
                </div>
              </MotionWrapper>
            </div>
          </ScrollReveal>

          {/* Referral Dashboard */}
          <ScrollReveal direction="right" delay={0.3}>
            <div className="space-y-8 lg:col-span-2">
              <MotionWrapper animation="slideUp" delay={0.1}>
                <ReferralDashboard />
              </MotionWrapper>
              <MotionWrapper animation="slideUp" delay={0.2}>
                <SubscriptionDashboard
                  user={user}
                  subscription={subscriptionDocs.docs[0]}
                  transactions={transactions}
                  subscriptionData={settings.subscriptionCosts}
                />
              </MotionWrapper>
            </div>
          </ScrollReveal>
        </div>

        {/* Quick Actions */}
        <ScrollReveal direction="up" delay={0.4}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: '📚', title: 'Learning', description: 'Access courses', href: '/learning' },
                { icon: '📱', title: 'Testing', description: 'Take quizzes', href: '/testing' },
                { icon: '🎥', title: 'Videos', description: 'Watch tutorials', href: '/videos' },
                { icon: '📖', title: 'Library', description: 'Read books', href: '/library' },
              ].map((action, index) => (
                <MotionWrapper
                  key={action.title}
                  animation="scale"
                  delay={0.1 * index}
                  className="h-full"
                >
                  <Link href={action.href}>
                    <div className="p-4 md:p-6 text-center rounded-xl border transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/8 hover:border-indigo-500/30 hover:scale-105 cursor-pointer h-full flex flex-col justify-center">
                      <div className="mb-2 text-2xl md:text-3xl">{action.icon}</div>
                      <h4 className="mb-1 font-medium text-white text-sm md:text-base">{action.title}</h4>
                      <p className="text-xs md:text-sm text-white/60">{action.description}</p>
                    </div>
                  </Link>
                </MotionWrapper>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </DashboardLayout>
  )
}
