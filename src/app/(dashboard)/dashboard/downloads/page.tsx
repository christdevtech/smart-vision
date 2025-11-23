import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Download } from 'lucide-react'

export default async function DownloadsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout user={user} title="Downloads">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Offline Downloads</h1>
                  <p className="text-lg text-muted-foreground">
                    Access your in-app downloads. Screenshots and external exports are disabled.
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Downloads List */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Your Downloads</h2>
              <p className="text-muted-foreground">
                When you download books or videos for offline access, they appear here.
              </p>
              <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
                No downloads yet.
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}