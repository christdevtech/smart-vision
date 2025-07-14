import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import Link from 'next/link'
import ReferralDashboard from '@/components/ReferralDashboard'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <svg
              width="40"
              height="40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_4px_8px_rgba(79,70,229,0.3)]"
            >
              <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
              <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
              <circle cx="75" cy="25" r="8" fill="#10B981" />
              <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-br from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              SmartVision
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm">Welcome, {user.firstName || user.email}</span>
            {user.role !== 'user' && (
              <Link
                href={payloadConfig.routes.admin}
                className="text-white bg-white/10 border border-white/20 no-underline px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/15 hover:border-white/30"
                target="_blank"
                rel="noopener noreferrer"
              >
                Admin
              </Link>
            )}
            <Link
              href="/logout"
              className="text-white bg-white/10 border border-white/20 no-underline px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/15 hover:border-white/30"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* User Info Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Manage your account and track your referrals</p>
        </div>

        {/* User Information Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">👤 Profile Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Name</label>
                  <p className="text-white">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Member Since</label>
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
                    <label className="block text-sm text-white/60 mb-1">Referred By</label>
                    <p className="text-emerald-400">✓ Referred User</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Referral Dashboard */}
          <div className="lg:col-span-2">
            <ReferralDashboard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="text-white font-medium mb-1">Learning</h4>
            <p className="text-white/60 text-sm">Access courses</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="text-white font-medium mb-1">Testing</h4>
            <p className="text-white/60 text-sm">Take quizzes</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="text-2xl mb-2">🎥</div>
            <h4 className="text-white font-medium mb-1">Videos</h4>
            <p className="text-white/60 text-sm">Watch tutorials</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center transition-all duration-300 hover:bg-white/8 hover:border-indigo-500/30">
            <div className="text-2xl mb-2">📖</div>
            <h4 className="text-white font-medium mb-1">Library</h4>
            <p className="text-white/60 text-sm">Read books</p>
          </div>
        </div>
      </main>
    </div>
  )
}
