'use client'

import { BadgeCheck, Check, Copy, Gift, Users, Wallet } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import type { User } from '@/payload-types'

interface ReferralStats {
  eligibility: {
    active: boolean
    subscriptionEndDate: string | null
  }
  program: {
    enabled: boolean
    providerFeePercentage: number
    rewardPercentage: number
  }
  referralCode: string
  referralLink: string
  referredUsers: Array<{
    firstName: string
    id: string
    joinedAt: string
    status: string
  }>
  rewards: Array<{
    amount: number
    grossPaymentAmount: number
    id: string
    plan: string
    ratePercentage: number
    settledAt: string
    status: string
  }>
  summary: {
    availableEarnings: number
    paidEarnings: number
    qualifiedReferrals: number
    reversedEarnings: number
    totalEarnings: number
    totalReferrals: number
  }
}

interface ReferralDashboardProps {
  className?: string
  user?: User
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en', {
    currency: 'XAF',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

export default function ReferralDashboard({ className = '', user }: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchReferralStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/custom/referral/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch referral stats')
      }

      setStats((await response.json()) as ReferralStats)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReferralStats()
  }, [fetchReferralStats])

  const copyToClipboard = async () => {
    if (!stats?.referralLink) return

    try {
      await navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (caughtError) {
      console.error('Failed to copy referral link:', caughtError)
    }
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border border-border/50 bg-card p-6 ${className}`}>
        <div className="mb-6 flex items-center gap-3">
          <Gift className="h-5 w-5 text-primary" />
          <p className="font-medium text-foreground">Referral rewards</p>
        </div>
        <div className="grid animate-pulse gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-24 rounded-lg bg-muted/20" key={item} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div
        className={`rounded-2xl border border-destructive/20 bg-destructive/10 p-6 ${className}`}
      >
        <p className="mb-2 text-destructive">
          Error loading referral data: {error || 'No data was returned'}
        </p>
        <button
          className="rounded bg-destructive/20 px-4 py-2 text-destructive transition-colors hover:bg-destructive/30"
          onClick={() => void fetchReferralStats()}
          type="button"
        >
          Retry
        </button>
      </div>
    )
  }

  const displayCode = stats.referralCode || user?.referralCode || '—'
  const eligibilityLabel = !stats.program.enabled
    ? 'Program paused'
    : stats.eligibility.active
      ? 'Eligible to earn'
      : 'Active subscription required'

  return (
    <div className={`rounded-2xl border border-border/50 bg-card p-6 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-primary" />
          <p className="font-medium text-foreground">Referral rewards</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            stats.program.enabled && stats.eligibility.active
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {eligibilityLabel}
        </span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Earn {stats.program.rewardPercentage}% of each referred student&apos;s successful
        subscription payment while your own subscription is active.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-input p-4">
          <Wallet className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-1 text-sm text-muted-foreground">Available earnings</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(stats.summary.availableEarnings)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-input p-4">
          <Gift className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-1 text-sm text-muted-foreground">Lifetime earned</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(stats.summary.totalEarnings)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-input p-4">
          <Users className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-1 text-sm text-muted-foreground">Total referrals</p>
          <p className="text-lg font-semibold text-foreground">{stats.summary.totalReferrals}</p>
        </div>
        <div className="rounded-lg border border-border bg-input p-4">
          <BadgeCheck className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-1 text-sm text-muted-foreground">Qualified referrals</p>
          <p className="text-lg font-semibold text-foreground">
            {stats.summary.qualifiedReferrals}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-input p-3">
          <p className="mb-1 text-sm text-muted-foreground">Referral code</p>
          <p className="text-lg font-medium text-foreground">{displayCode}</p>
        </div>
        <div className="rounded-lg border border-border bg-input p-3">
          <p className="mb-1 text-sm text-muted-foreground">Eligibility period</p>
          <p className="text-sm font-medium text-foreground">
            {stats.eligibility.subscriptionEndDate
              ? `Active until ${formatDate(stats.eligibility.subscriptionEndDate)}`
              : 'No active paid subscription'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm text-muted-foreground">Share your link</label>
        <div className="flex gap-2">
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border bg-input p-3 text-sm text-foreground">
            {stats.referralLink || 'Link unavailable'}
          </div>
          <button
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={!stats.referralLink}
            onClick={() => void copyToClipboard()}
            type="button"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
        <section>
          <h4 className="mb-3 text-sm font-medium text-foreground">Recent referrals</h4>
          {stats.referredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {stats.referredUsers.slice(0, 6).map((referredUser) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-input p-3"
                  key={referredUser.id}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {referredUser.firstName || 'Student'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(referredUser.joinedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {referredUser.status.replaceAll('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-3 text-sm font-medium text-foreground">Recent rewards</h4>
          {stats.rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Rewards appear here after a referred student completes a subscription payment.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {stats.rewards.slice(0, 6).map((reward) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-input p-3"
                  key={reward.id}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(reward.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reward.ratePercentage}% of {formatCurrency(reward.grossPaymentAmount)} ·{' '}
                      {reward.plan} · {formatDate(reward.settledAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                    {reward.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
