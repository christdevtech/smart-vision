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
    <div className="min-h-screen text-white bg-black">
      {/* Header */}

      {/* Main Content */}
      <main className="px-6 py-8 mx-auto max-w-6xl">
        {/* User Info Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">Manage your account and track your referrals</p>
        </div>

        {/* User Information Card */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="p-6 space-y-6 rounded-xl border bg-white/5 border-white/10">
              <div className="flex gap-4 items-center pb-4 border-b border-white/10">
                <div className="relative w-16 h-16 rounded-full">
                  {user.profilePic ? (
                    <Media
                      fill
                      resource={user.profilePic}
                      imgClassName="object-cover rounded-full"
                    />
                  ) : (
                    <span> 👤</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white"> Profile Information</h3>
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
          </div>

          {/* Referral Dashboard */}
          <div className="space-y-8 lg:col-span-2">
            <ReferralDashboard />
            <SubscriptionDashboard
              user={user}
              subscription={subscriptionDocs.docs[0]}
              transactions={transactions}
              subscriptionData={settings.subscriptionCosts}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 text-center rounded-xl border transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="mb-2 text-2xl">📚</div>
            <h4 className="mb-1 font-medium text-white">Learning</h4>
            <p className="text-sm text-white/60">Access courses</p>
          </div>
          <div className="p-6 text-center rounded-xl border transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="mb-2 text-2xl">📱</div>
            <h4 className="mb-1 font-medium text-white">Testing</h4>
            <p className="text-sm text-white/60">Take quizzes</p>
          </div>
          <div className="p-6 text-center rounded-xl border transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="mb-2 text-2xl">🎥</div>
            <h4 className="mb-1 font-medium text-white">Videos</h4>
            <p className="text-sm text-white/60">Watch tutorials</p>
          </div>
          <div className="p-6 text-center rounded-xl border transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="mb-2 text-2xl">📖</div>
            <h4 className="mb-1 font-medium text-white">Library</h4>
            <p className="text-sm text-white/60">Read books</p>
          </div>
        </div>
      </main>
    </div>
  )
}
