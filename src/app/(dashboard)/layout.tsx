import React from 'react'
import '../styles.css'

export const metadata = {
  description:
    'SmartVision Dashboard - Access your personalized learning content, track progress, and manage your account.',
  title: 'Dashboard - SmartVision',
}

import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (user && !user.onboarded) {
    redirect('/onboarding')
  }

  return <div className="min-h-screen text-foreground bg-dashboard-background">{children}</div>
}
