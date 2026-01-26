import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { BookOpen } from 'lucide-react'
import { Book } from '@/payload-types'
import BookProgressTracker from '@/components/Progress/BookProgressTracker'
import { Subscription } from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'
import PDFReader from '@/components/Library/PDFReader'
import RichText from '@/components/RichText'

export default async function ReadBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { bookId } = await params

  if (!user) {
    redirect('/auth/login')
  }

  const res = await payload.find({
    collection: 'books',
    where: { id: { equals: bookId } },
    limit: 1,
    depth: 1,
  })
  const bookDoc = (res.docs?.[0] as Book) || null
  if (!bookDoc) {
    redirect('/dashboard/library')
  }

  const subsRes = await payload.find({
    collection: 'subscriptions',
    where: { user: { equals: user.id } },
    limit: 1,
  })
  const sub = (subsRes.docs?.[0] as Subscription) || null
  const subscriptionActive = isSubscriptionActive(sub)

  return (
    <DashboardLayout user={user} title="Read Book">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {(bookDoc as any).title || bookId}
                  </h1>
                  <p className="text-lg text-muted-foreground">Secure in-app PDF reader</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
              {bookDoc.subscriptionRequired && !subscriptionActive && (
                <div className="flex justify-between items-center p-3 rounded-xl border bg-input border-border">
                  <p className="text-sm text-muted-foreground">
                    You need an active subscription to access this book.
                  </p>
                  <a
                    href="/dashboard/subscriptions"
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    Subscribe
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Author</p>
                  <p className="text-foreground">{(bookDoc as any).author || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Pages</p>
                  <p className="text-foreground">{(bookDoc as any).pageCount || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">ISBN</p>
                  <p className="text-foreground">{(bookDoc as any).isbn || '—'}</p>
                </div>
              </div>
              {bookDoc.description && (
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <RichText
                    data={bookDoc.description}
                    className="text-foreground"
                    enableProse={false}
                    enableGutter={false}
                  />
                </div>
              )}
              {(!bookDoc.subscriptionRequired || subscriptionActive) &&
                typeof bookDoc.pdf === 'object' &&
                (bookDoc.pdf as any)?.filename && (
                  <PDFReader filename={(bookDoc.pdf as any).filename} />
                )}
              <BookProgressTracker
                userId={user.id}
                contentId={bookDoc.id}
                subjectId={
                  typeof bookDoc.subject === 'string'
                    ? (bookDoc.subject as string)
                    : ((bookDoc.subject as any)?.id as string)
                }
              />
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
