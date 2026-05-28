'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, Sparkles, ArrowRight, Check } from 'lucide-react'
import type { Subscription, Setting } from '@/payload-types'

interface SubscriptionCardProps {
  subscriptionActive: boolean
  subscription: Subscription | null
  subscriptionCosts: Setting['subscriptionCosts']
}

const BENEFITS = [
  '500+ video lessons',
  'Digital library access',
  'Unlimited MCQ tests',
  'AI study planner',
]

function formatCurrency(amount: number): string {
  return `FCFA ${amount.toLocaleString()}`
}

export default function SubscriptionCard({
  subscriptionActive,
  subscription,
  subscriptionCosts,
}: SubscriptionCardProps) {
  // Subscribed users: compact status line
  if (subscriptionActive && subscription) {
    const planLabel =
      subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    const endDate = new Date(subscription.endDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="flex items-center gap-3 p-4 rounded-xl border bg-card border-border"
      >
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Crown className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {planLabel} Subscription
          </p>
          <p className="text-xs text-muted-foreground">Active until {endDate}</p>
        </div>
        <Link
          href="/dashboard/subscriptions"
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Manage
        </Link>
      </motion.div>
    )
  }

  // Free/expired users: prominent upgrade card
  const monthlyPrice = subscriptionCosts?.monthly ?? 3000

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 border-primary/20"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            Unlock Your Full Potential
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Starting from{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(monthlyPrice)}/month
          </span>
        </p>

        <Link
          href="/dashboard/subscriptions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Crown className="w-4 h-4" />
          Subscribe Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  )
}
