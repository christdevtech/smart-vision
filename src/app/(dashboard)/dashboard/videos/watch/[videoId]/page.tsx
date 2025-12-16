import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Play } from 'lucide-react'
import { Video } from '@/payload-types'
import { Media } from '@/components/Media'

export default async function WatchVideoPage({ params }: { params: { videoId: string } }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const res = await payload.find({
    collection: 'videos',
    where: { id: { equals: params.videoId } },
    limit: 1,
    depth: 1,
  })
  const videoDoc = (res.docs?.[0] as Video) || null
  if (!videoDoc) {
    redirect('/dashboard/videos')
  }

  return (
    <DashboardLayout user={user} title="Watch Video">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to secondary">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {(videoDoc as any).title || params.videoId}
                  </h1>
                  <p className="text-lg text-muted-foreground">Player and controls</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                <Media
                  resource={videoDoc.video as any}
                  videoClassName="w-full h-full object-cover"
                />
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
