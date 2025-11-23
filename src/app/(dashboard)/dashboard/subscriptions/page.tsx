import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import SubscriptionDashboard from '@/components/SubscriptionDashboard'
import { Crown } from 'lucide-react'
import { getSubscriptionCosts } from '@/utilities/subscription'

export default async function SubscriptionsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch subscription offerings
  const subscriptionData = await getSubscriptionCosts(payload)

  // Fetch user's subscription and transactions
  const subscriptionDocs = await payload.find({
    collection: 'subscriptions',
    where: { user: { equals: user.id } },
    limit: 1,
    sort: '-createdAt',
  })

  const transactionDocs = await payload.find({
    collection: 'transactions',
    where: { user: { equals: user.id } },
  })

  const transactions = transactionDocs.docs
  const subscription = subscriptionDocs.docs[0] || null

  return (
    <DashboardLayout user={user} title="Subscriptions">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Manage Subscriptions</h1>
                  <p className="text-lg text-muted-foreground">
                    View your plan, change tiers, and manage billing.
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Subscription Dashboard */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <SubscriptionDashboard 
              user={user}
              subscriptionData={subscriptionData}
              subscription={subscription}
              transactions={transactions}
            />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}