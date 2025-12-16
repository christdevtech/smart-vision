import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { CreditCard } from 'lucide-react'

export default async function AccountSubscriptionPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

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
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              <p className="text-muted-foreground">Subscription details will be displayed here.</p>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
