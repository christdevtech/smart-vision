import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { BookOpen, Lock } from 'lucide-react'
import { Book } from '@/payload-types'
import BookProgressTracker from '@/components/Progress/BookProgressTracker'
import { Subscription } from '@/payload-types'
import { isSubscriptionActive, hasTierAccess, SubscriptionPlan } from '@/utilities/subscription'
import PDFReader from '@/components/Library/PDFReader'
import RichText from '@/components/RichText'
import Link from 'next/link'

export default async function ReadBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { bookId } = await params

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch the book with depth:2 to ensure pdf->media is fully populated
  const res = await payload.find({
    collection: 'books',
    where: { id: { equals: bookId } },
    limit: 1,
    depth: 2,
  })
  const bookDoc = (res.docs?.[0] as Book) || null

  if (!bookDoc) {
    redirect('/dashboard/library')
  }

  // Bug fix 1: check isActive — if admin forgot to activate the book, show a clear message
  if (bookDoc.isActive === false) {
    return (
      <DashboardLayout user={user} title="Book Unavailable">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="p-8 rounded-2xl border bg-card border-border max-w-md text-center space-y-4">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Book Not Available</h1>
            <p className="text-muted-foreground">
              This book is currently unavailable. Please check back later or contact support.
            </p>
            <Link
              href="/dashboard/library"
              className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Back to Library
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch user's subscription
  const subsRes = await payload.find({
    collection: 'subscriptions',
    where: { user: { equals: user.id } },
    limit: 1,
    sort: '-createdAt',
  })
  const sub = (subsRes.docs?.[0] as Subscription) || null
  const subscriptionActive = isSubscriptionActive(sub)

  // Rank-based tier check: a higher-tier user is never blocked from lower-tier content.
  // e.g. annual ⊇ monthly ⊇ free
  const userPlan: SubscriptionPlan = sub?.plan ?? 'free'
  const bookTiers: SubscriptionPlan[] = (bookDoc.subscriptionTiers as SubscriptionPlan[]) ?? []

  const tierAccess = hasTierAccess(
    userPlan,
    bookTiers,
    bookDoc.subscriptionRequired,
    subscriptionActive,
  )

  // Resolve PDF URL — try populated object first, fall back gracefully
  const pdfMedia = bookDoc.pdf as any
  const pdfFilename: string | null =
    typeof pdfMedia === 'object' && pdfMedia !== null
      ? (pdfMedia.filename ?? pdfMedia.url ?? null)
      : null

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
              {/* Subscription gate message */}
              {bookDoc.subscriptionRequired && !subscriptionActive && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl border bg-input border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Subscription Required</p>
                    <p className="text-sm text-muted-foreground">
                      You need an active subscription to access this book.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/subscriptions"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm whitespace-nowrap"
                  >
                    Subscribe Now
                  </Link>
                </div>
              )}

              {/* Tier mismatch message (has subscription but wrong tier) */}
              {bookDoc.subscriptionRequired && subscriptionActive && !tierAccess && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl border bg-input border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Upgrade Required</p>
                    <p className="text-sm text-muted-foreground">
                      This book requires a{' '}
                      {bookTiers.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' or ')}{' '}
                      subscription. Your current plan is{' '}
                      <span className="font-medium capitalize">{userPlan}</span>.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/subscriptions"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm whitespace-nowrap"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              )}

              {/* Book metadata */}
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

              {/* PDF Reader — only when access is granted AND pdf is available */}
              {tierAccess && pdfFilename ? (
                <PDFReader filename={pdfFilename} />
              ) : tierAccess && !pdfFilename ? (
                <div className="p-4 rounded-lg border bg-input border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    PDF file is not available for this book. Please contact support.
                  </p>
                </div>
              ) : null}

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
