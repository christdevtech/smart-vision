import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { User } from 'lucide-react'
import { Media } from '@/components/Media'

export default async function AccountProfilePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout user={user} title="Profile">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Profile</h1>
                  <p className="text-lg text-muted-foreground">Manage personal information</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
              <div className="flex gap-3 items-center">
                <div className="flex relative justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  {user.profilePic ? (
                    <Media
                      resource={user.profilePic as any}
                      alt={user.firstName || 'User'}
                      imgClassName="w-full h-full rounded-full object-cover"
                      fill
                    />
                  ) : (
                    <span className="text-lg font-semibold text-primary-foreground">
                      {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-foreground">{user.phoneNumber || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Academic Level</p>
                  <p className="text-foreground">
                    {typeof user.academicLevel === 'string'
                      ? user.academicLevel
                      : (user.academicLevel as any)?.name || '—'}
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
