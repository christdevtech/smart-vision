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
      <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-destructive/10 border border-destructive/20 rounded-xl p-6 ${className}`}>
        <p className="text-destructive">Error: {error}</p>
        <button
          onClick={fetchReferralStats}
          className="mt-2 px-4 py-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-foreground mb-4">🎯 Referral Dashboard</h3>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{stats.totalReferrals}</div>
          <div className="text-sm text-muted-foreground">Total Referrals</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.referralCode}</div>
          <div className="text-sm text-muted-foreground">Your Code</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">🎁</div>
          <div className="text-sm text-muted-foreground">Rewards Earned</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Your Referral Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={stats.referralLink}
            readOnly
            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent Referrals */}
      {stats.referredUsers.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-foreground mb-3">Recent Referrals</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stats.referredUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="bg-card rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <div className="text-foreground font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
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
          <div className="text-muted-foreground mb-2">No referrals yet</div>
          <div className="text-sm text-muted-foreground/60">
            Share your referral link to start earning rewards!
          </div>
        </div>
      )}
    </div>
  )
}
