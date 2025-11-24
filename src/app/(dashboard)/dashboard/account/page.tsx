import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { User } from 'lucide-react'
import AccountManagement from '@/components/AccountManagement'

export default async function AccountManagementPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const levels = await payload.find({
    collection: 'academicLevels',
    limit: 100,
    select: { id: true, name: true },
    sort: 'name',
  })

  let profileMedia: any = null
  if (user?.profilePic && typeof user.profilePic === 'string') {
    try {
      profileMedia = await payload.findByID({ collection: 'media', id: user.profilePic })
    } catch {}
  } else if (user?.profilePic && typeof user.profilePic === 'object') {
    profileMedia = user.profilePic
  }

  return (
    <DashboardLayout user={user} title="Account Management">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Account Management</h1>
                  <p className="text-lg text-muted-foreground">
                    Manage your profile, settings, subscription, and account preferences
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <AccountManagement
              user={user}
              academicLevels={levels.docs as any}
              profileMedia={user.profilePic}
            />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
