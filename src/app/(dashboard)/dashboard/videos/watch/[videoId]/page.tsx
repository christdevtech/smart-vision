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
import VideoProgressTracker from '@/components/Progress/VideoProgressTracker'
import RichText from '@/components/RichText'
import { resolveContentAccess, resolveContentMedia } from '@/services/contentAuthorization'
import { createMediaFileURL } from '@/utilities/mediaDelivery'

export default async function WatchVideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { videoId } = await params

  if (!user) {
    redirect('/auth/login')
  }

  const contentAccess = await resolveContentAccess({
    contentId: videoId,
    contentType: 'video',
    payload,
    user,
  })
  const videoDoc = contentAccess.content as Video | null
  if (!videoDoc) {
    redirect('/dashboard/videos')
  }

  const videoMedia = contentAccess.allowed
    ? await resolveContentMedia({
        content: videoDoc,
        contentType: 'video',
        field: 'video',
        payload,
      })
    : null
  const videoUrl = videoMedia
    ? createMediaFileURL(videoMedia, {
        contentId: videoDoc.id,
        contentType: 'video',
        field: 'video',
        userId: user.id,
      })
    : null

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
                    {(videoDoc as any).title || videoId}
                  </h1>
                  {videoDoc.description && (
                    <RichText
                      data={videoDoc.description}
                      className="text-lg text-muted-foreground"
                      enableProse={false}
                      enableGutter={false}
                    />
                  )}
                  {/* Fallback if no description */}
                  {!videoDoc.description && (
                    <p className="text-lg text-muted-foreground">Player and controls</p>
                  )}
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              {!contentAccess.allowed && (
                <div className="flex justify-between items-center p-3 mb-3 rounded-xl border bg-input border-border">
                  <p className="text-sm text-muted-foreground">
                    You need an active subscription to watch videos.
                  </p>
                  <a
                    href="/dashboard/subscriptions"
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    Subscribe
                  </a>
                </div>
              )}
              {contentAccess.allowed && videoMedia && videoUrl && (
                <div className="overflow-hidden w-full bg-black rounded-xl aspect-video">
                  <Media
                    resource={videoMedia}
                    src={videoUrl}
                    videoClassName="w-full h-full object-cover"
                  />
                </div>
              )}
              {contentAccess.allowed && (
                <VideoProgressTracker
                  userId={user.id}
                  contentId={videoDoc.id}
                  subjectId={
                    typeof videoDoc.subject === 'string'
                      ? (videoDoc.subject as string)
                      : ((videoDoc.subject as any)?.id as string)
                  }
                />
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
