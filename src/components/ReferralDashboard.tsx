'use client'

import React, { useState, useEffect } from 'react'

interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  referredUsers: Array<{
    id: string
    email: string
    firstName?: string
    lastName?: string
    createdAt: string
  }>
  referredBy: string | null
}

interface ReferralDashboardProps {
  className?: string
}

export default function ReferralDashboard({ className = '' }: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/custom/referral/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!stats?.referralLink) return
    
    try {
      await navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-6 ${className}`}>
        <p className="text-red-400">Error: {error}</p>
        <button 
          onClick={fetchReferralStats}
          className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-white mb-4">🎯 Referral Dashboard</h3>
      
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{stats.totalReferrals}</div>
          <div className="text-sm text-white/60">Total Referrals</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-500">{stats.referralCode}</div>
          <div className="text-sm text-white/60">Your Code</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">🎁</div>
          <div className="text-sm text-white/60">Rewards Earned</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={stats.referralLink}
            readOnly
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent Referrals */}
      {stats.referredUsers.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Recent Referrals</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stats.referredUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.email
                    }
                  </div>
                  <div className="text-xs text-white/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-emerald-500 text-sm font-medium">+1</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Referrals Message */}
      {stats.referredUsers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-white/60 mb-2">No referrals yet</div>
          <div className="text-sm text-white/40">
            Share your referral link to start earning rewards!
          </div>
        </div>
      )}
    </div>
  )
}