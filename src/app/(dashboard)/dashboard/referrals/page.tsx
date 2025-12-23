import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Users } from 'lucide-react'
import ReferralDashboard from '@/components/ReferralDashboard'

export default async function ReferralsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout user={user} title="Referrals">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Referral Program</h1>
                  <p className="text-lg text-muted-foreground">
                    Invite friends and earn rewards when they subscribe.
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Referral Dashboard */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <ReferralDashboard user={user} />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
