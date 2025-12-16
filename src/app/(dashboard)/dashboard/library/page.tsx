import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Library } from 'lucide-react'
import { Subject } from '@/payload-types'
import Link from 'next/link'

export default async function DigitalLibraryPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const subjectsRes = await payload.find({
    collection: 'subjects',
    limit: 200,
  })
  const subjects = subjectsRes.docs as Subject[]

  return (
    <DashboardLayout user={user} title="Digital Library">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          {/* Page Header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Library className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Digital Library</h1>
                  <p className="text-lg text-muted-foreground">
                    Access books, documents, research papers, and study materials
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Content Area */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/library/${s.slug || s.id}`}
                  className="p-4 rounded-2xl border bg-card border-border hover:bg-accent transition-colors"
                >
                  <p className="text-lg font-medium text-foreground">{(s as any).name || s.id}</p>
                  <p className="text-sm text-muted-foreground">Tap to view books</p>
                </Link>
              ))}
              {!subjects.length && (
                <div className="p-6 rounded-2xl border bg-card border-border/50">
                  <p className="text-muted-foreground">No subjects available yet.</p>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
