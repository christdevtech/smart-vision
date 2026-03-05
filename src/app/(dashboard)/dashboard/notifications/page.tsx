import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Bell } from 'lucide-react'
import NotificationsPageClient from '@/components/Notifications/Client'
import { Notification } from '@/payload-types'

export default async function NotificationsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const notificationsRes = await payload.find({
    collection: 'notifications',
    where: {
      and: [{ recipient: { equals: user.id } }, { isActive: { equals: true } }],
    },
    sort: '-createdAt',
    limit: 100,
  })

  const notifications = notificationsRes.docs as Notification[]

  return (
    <DashboardLayout user={user} title="Notifications">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Notifications</h1>
                  <p className="text-lg text-muted-foreground">
                    Stay up to date with your activity, payments, and achievements
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Notifications Client */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <NotificationsPageClient initialNotifications={notifications} userId={user.id} />
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
