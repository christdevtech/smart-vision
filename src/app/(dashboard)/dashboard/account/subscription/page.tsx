import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { CreditCard } from 'lucide-react'
import { Subscription } from '@/payload-types'
import { isSubscriptionActive, getSubscriptionCosts } from '@/utilities/subscription'

export default async function AccountSubscriptionPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const subsRes = await payload.find({
    collection: 'subscriptions',
    where: { user: { equals: user.id } },
    limit: 1,
  })
  const sub = (subsRes.docs?.[0] as Subscription) || null
  const costs = await getSubscriptionCosts(payload)
  const active = isSubscriptionActive(sub)
  const planLabel = sub?.plan || 'free'

  return (
    <DashboardLayout user={user} title="Subscription">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Subscription</h1>
                  <p className="text-lg text-muted-foreground">Manage your plan and payments</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-foreground">{planLabel}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p
                    className={`text-foreground ${active ? 'text-emerald-600 dark:text-emerald-300' : ''}`}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {sub && (
                  <>
                    <div className="p-3 rounded-lg border bg-input border-border">
                      <p className="text-sm text-muted-foreground">Start</p>
                      <p className="text-foreground">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-input border-border">
                      <p className="text-sm text-muted-foreground">End</p>
                      <p className="text-foreground">
                        {new Date(sub.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="p-3 rounded-lg border bg-input border-border">
                <p className="text-sm text-muted-foreground">Pricing</p>
                <p className="text-foreground">
                  Monthly {costs.monthly} • Annual {costs.yearly}
                </p>
              </div>
              {!active && (
                <div className="flex gap-2">
                  <a
                    href="/dashboard/subscriptions"
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    Subscribe
                  </a>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
