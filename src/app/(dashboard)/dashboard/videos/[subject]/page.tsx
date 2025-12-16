import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { PlayCircle } from 'lucide-react'
import { Subject, Video } from '@/payload-types'
import Link from 'next/link'

export default async function SubjectVideosPage({ params }: { params: { subject: string } }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  async function resolveSubject(): Promise<Subject | null> {
    const bySlug = await payload.find({
      collection: 'subjects',
      where: { slug: { equals: params.subject } },
      limit: 1,
    })
    const slugDoc = (bySlug.docs?.[0] as Subject) || null
    if (slugDoc) return slugDoc
    const byId = await payload.find({
      collection: 'subjects',
      where: { id: { equals: params.subject } },
      limit: 1,
    })
    return (byId.docs?.[0] as Subject) || null
  }
  const subject = await resolveSubject()
  if (!subject) {
    redirect('/dashboard/videos')
  }
  const vidsRes = await payload.find({
    collection: 'videos',
    where: { subject: { equals: subject.id } },
    limit: 100,
  })
  const vids = vidsRes.docs as Video[]

  return (
    <DashboardLayout user={user} title="Video Library">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {(subject as any).name || subject.slug || subject.id}
                  </h1>
                  <p className="text-lg text-muted-foreground">Browse tutorial videos</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {vids.map((v) => (
                <Link
                  key={v.id}
                  href={`/dashboard/videos/watch/${v.id}`}
                  className="p-3 rounded-xl border bg-card border-border hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-foreground">{(v as any).title || v.id}</p>
                  <p className="text-sm text-muted-foreground">Tap to watch</p>
                </Link>
              ))}
              {!vids.length && (
                <div className="p-6 rounded-2xl border bg-card border-border/50">
                  <p className="text-muted-foreground">No videos available for this subject.</p>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
