'use client'

import React from 'react'
import { Crown } from 'lucide-react'

export default function SubscriptionDashboard({
  user,
  subscriptionData,
  subscription,
  transactions,
}: {
  user: any
  subscriptionData: { monthly: number; yearly: number }
  subscription: any
  transactions: any[]
}) {
  const plan = subscription?.plan || 'free'
  const status = subscription?.paymentStatus || 'expired'

  return (
    <div className="p-6 rounded-2xl border bg-card border-border/50">
      <div className="flex gap-3 items-center mb-3">
        <Crown className="w-5 h-5 text-primary" />
        <p className="font-medium text-foreground">Your Subscription</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="text-foreground">{plan}</p>
        </div>
        <div className="p-3 rounded-lg border bg-input border-border">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-foreground">{status}</p>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg border bg-input border-border">
        <p className="text-sm text-muted-foreground">Pricing</p>
        <p className="text-foreground">Monthly {subscriptionData.monthly} • Annual {subscriptionData.yearly}</p>
      </div>
      <div className="mt-4">
        <p className="mb-2 font-medium text-foreground">Recent Transactions</p>
        {transactions.length ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t: any) => (
              <div key={t.id} className="p-3 rounded-lg border bg-input border-border">
                <p className="text-sm">
                  {t.status || 'created'} • {t.amount} • {new Date(t.dateInitiated).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg border bg-input border-border">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <a href="/dashboard/subscriptions" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground">
          Manage Plan
        </a>
      </div>
    </div>
  )
}

