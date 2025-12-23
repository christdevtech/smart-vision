'use client'

import React, { useState, useEffect } from 'react'
import { Users, Copy, Check } from 'lucide-react'
import { User } from '@/payload-types'

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
  user?: User
  className?: string
}

export default function ReferralDashboard({ user, className = '' }: ReferralDashboardProps) {
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

  // Use stats if available, fallback to user prop for basic display if needed
  const displayCode = stats?.referralCode || user?.referralCode || '—'
  const displayCount = stats?.totalReferrals ?? user?.totalReferrals ?? 0
  const displayLink = stats?.referralLink || ''

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border bg-card border-border/50 ${className}`}>
        <div className="flex gap-3 items-center mb-6">
          <Users className="w-5 h-5 text-primary" />
          <p className="font-medium text-foreground">Your Referral Details</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-lg bg-muted/20"></div>
            <div className="h-20 rounded-lg bg-muted/20"></div>
          </div>
          <div className="h-10 rounded-lg bg-muted/20"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`p-6 rounded-2xl border bg-destructive/10 border-destructive/20 ${className}`}
      >
        <p className="mb-2 text-destructive">Error loading referral data: {error}</p>
        <button
          onClick={fetchReferralStats}
          className="px-4 py-2 rounded transition-colors bg-destructive/20 text-destructive hover:bg-destructive/30"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-2xl border bg-card border-border/50 ${className}`}>
      <div className="flex gap-3 items-center mb-6">
        <Users className="w-5 h-5 text-primary" />
        <p className="font-medium text-foreground">Your Referral Details</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="mb-1 text-sm text-muted-foreground">Referral Code</p>
          <p className="text-lg font-medium text-foreground">{displayCode}</p>
        </div>
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="mb-1 text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-lg font-medium text-foreground">{displayCount}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm text-muted-foreground">Share your link</label>
        <div className="flex gap-2">
          <div className="overflow-hidden flex-1 p-3 text-sm whitespace-nowrap rounded-lg border bg-input border-border text-foreground text-ellipsis">
            {displayLink || 'Link unavailable'}
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!displayLink}
            className="flex gap-2 items-center px-4 py-2 font-medium rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent Referrals */}
      {stats?.referredUsers && stats.referredUsers.length > 0 && (
        <div className="pt-6 mt-6 border-t border-border">
          <h4 className="mb-3 text-sm font-medium text-foreground">Recent Referrals</h4>
          <div className="overflow-y-auto space-y-2 max-h-40">
            {stats.referredUsers.slice(0, 5).map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center p-3 rounded-lg border bg-input border-border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-2 py-1 text-xs font-medium text-emerald-500 rounded-full bg-emerald-500/10">
                  +1
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
