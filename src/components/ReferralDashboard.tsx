'use client'

import React from 'react'
import { Users } from 'lucide-react'

export default function ReferralDashboard({ user }: { user: any }) {
  const code = user?.referralCode || ''
  const count = user?.totalReferrals || 0
  const [copied, setCopied] = React.useState(false)

  function copyLink() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/auth/register?ref=${code}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="p-6 rounded-2xl border bg-card border-border/50">
      <div className="flex gap-3 items-center mb-3">
        <Users className="w-5 h-5 text-primary" />
        <p className="font-medium text-foreground">Your Referral Details</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="text-sm text-muted-foreground">Referral Code</p>
          <p className="text-foreground">{code || '—'}</p>
        </div>
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-foreground">{count}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={copyLink}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          {copied ? 'Copied' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  )
}

