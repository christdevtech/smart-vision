import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { FileText, ArrowLeft, Crown, Lock, Clock, Award } from 'lucide-react'
import { ExamPaper, Subscription } from '@/payload-types'
import {
  isSubscriptionActive,
  hasTierAccess,
  SubscriptionPlan,
} from '@/utilities/subscription'
import Link from 'next/link'
import ExamPaperViewerClient from '@/components/QuestionBank/ExamPaperViewerClient'

export default async function ExamPaperViewerPage({
  params,
}: {
  params: Promise<{ paperId: string }>
}) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { paperId } = await params

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch the exam paper with depth:2 for populated relations
  const res = await payload.find({
    collection: 'exam-papers',
    where: { id: { equals: paperId } },
    limit: 1,
    depth: 2,
  })
  const paper = (res.docs?.[0] as ExamPaper) || null

  if (!paper || paper.isActive === false) {
    redirect('/dashboard/question-bank')
  }

  // Subscription check
  const subsRes = await payload.find({
    collection: 'subscriptions',
    where: { user: { equals: user.id } },
    limit: 1,
    sort: '-createdAt',
  })
  const sub = (subsRes.docs?.[0] as Subscription) || null
  const subscriptionActive = isSubscriptionActive(sub)
  const userPlan: SubscriptionPlan = sub?.plan ?? 'free'
  const paperTiers: SubscriptionPlan[] =
    (paper.subscriptionTiers as SubscriptionPlan[]) ?? []

  const tierAccess = hasTierAccess(
    userPlan,
    paperTiers,
    paper.subscriptionRequired,
    subscriptionActive,
  )

  // Use the extensionless secure proxy to fetch PDF bytes without IDM intercepting
  const pdfMedia = paper.pdf as any
  const pdfMediaId = typeof pdfMedia === 'object' && pdfMedia !== null ? pdfMedia.id : null
  const pdfUrl: string | null = pdfMediaId ? `/api/secure-pdf/${pdfMediaId}` : null

  // Resolve answer key PDF URL
  const answerKeyMedia = paper.answerKeyPdf as any
  const answerKeyMediaId =
    paper.hasAnswerKey && typeof answerKeyMedia === 'object' && answerKeyMedia !== null
      ? answerKeyMedia.id
      : null
  const answerKeyUrl: string | null = answerKeyMediaId
    ? `/api/secure-pdf/${answerKeyMediaId}`
    : null

  // Subject name
  const subjectName =
    typeof paper.subject === 'object' && paper.subject !== null
      ? paper.subject.name
      : '—'

  return (
    <DashboardLayout user={user} title={paper.title}>
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-6">
          {/* Back link + header */}
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <Link
              href="/dashboard/question-bank"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Question Bank
            </Link>

            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="mb-1 text-2xl sm:text-3xl font-bold text-foreground truncate">
                    {paper.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{subjectName}</span>
                    <span>·</span>
                    <span>Paper {paper.paperType}</span>
                    <span>·</span>
                    <span>{paper.year}</span>
                    {paper.duration && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {paper.duration} min
                        </span>
                      </>
                    )}
                    {paper.totalMarks && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {paper.totalMarks} marks
                        </span>
                      </>
                    )}
                  </div>
                  {paper.subscriptionRequired && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                      <Crown className="w-3 h-3" />
                      PREMIUM
                    </span>
                  )}
                </div>
              </div>
            </div>
          </MotionWrapper>

          {/* Access-gated viewer */}
          <MotionWrapper animation="fadeIn" delay={0.2}>
            {!tierAccess ? (
              /* ---- Subscription gate ---- */
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border bg-card border-border/50 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  {subscriptionActive ? (
                    <Lock className="w-8 h-8 text-amber-500" />
                  ) : (
                    <Crown className="w-8 h-8 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {subscriptionActive
                      ? 'Upgrade Required'
                      : 'Subscription Required'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subscriptionActive
                      ? `This paper requires a ${paperTiers.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' or ')} plan. Your current plan is ${userPlan}.`
                      : 'Subscribe to access this exam paper and all premium content.'}
                  </p>
                </div>
                <Link
                  href="/dashboard/subscriptions"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  {subscriptionActive ? 'Upgrade Plan' : 'Subscribe Now'}
                </Link>
              </div>
            ) : !pdfUrl ? (
              /* ---- PDF not available ---- */
              <div className="p-8 rounded-2xl border bg-card border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  PDF file is not available for this paper. Please contact support.
                </p>
              </div>
            ) : (
              /* ---- Protected PDF Viewer ---- */
              <ExamPaperViewerClient
                pdfUrl={pdfUrl}
                answerKeyUrl={answerKeyUrl}
                isProtected={!!paper.isProtected}
                subscriptionActive={subscriptionActive}
              />
            )}
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
