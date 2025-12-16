import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Trophy } from 'lucide-react'
import { TestResult, Mcq } from '@/payload-types'

export default async function TestResultPage({ params }: { params: { testId: string } }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const res = await payload.find({
    collection: 'test-results',
    where: { id: { equals: params.testId } },
    limit: 1,
  })
  const doc = (res.docs?.[0] as TestResult) || null
  if (!doc) {
    redirect('/dashboard/testing')
  }

  const questionDocs: Record<string, Mcq> = {}
  if (doc.questions?.length) {
    const ids = doc.questions.map((q) =>
      typeof q.question === 'string' ? q.question : (q.question as any).id,
    )
    const qs = await payload.find({
      collection: 'mcq',
      where: { id: { in: ids } },
      limit: ids.length,
    })
    for (const q of qs.docs as Mcq[]) {
      questionDocs[q.id] = q
    }
  }

  return (
    <DashboardLayout user={user} title="Test Results">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to secondary">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">Result</h1>
                  <p className="text-lg text-muted-foreground">Score {doc.scorePercentage}%</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="p-6 rounded-2xl border bg-card border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{doc.totalQuestions}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl font-bold">{doc.correctAnswers}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-2xl font-bold">{doc.incorrectAnswers}</p>
                </div>
                <div className="p-3 rounded-lg border bg-input border-border">
                  <p className="text-sm text-muted-foreground">Skipped</p>
                  <p className="text-2xl font-bold">{doc.skippedQuestions || 0}</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          {doc.questions?.length ? (
            <MotionWrapper animation="fadeIn" delay={0.3}>
              <div className="p-6 space-y-3 rounded-2xl border bg-card border-border/50">
                {doc.questions.map((qi) => {
                  const qid =
                    typeof qi.question === 'string' ? qi.question : (qi.question as any).id
                  const q = questionDocs[qid]
                  const correct = qi.selectedAnswer === qi.correctAnswer
                  const questionText = (() => {
                    const root = (q as any)?.question?.root
                    if (!root?.children) return ''
                    return root.children
                      .map((child: any) => child.text || '')
                      .join(' ')
                      .trim()
                  })()
                  return (
                    <div key={qid} className="p-3 rounded-lg border bg-input border-border">
                      <p className="mb-2 text-sm font-medium">{questionText || 'Question'}</p>
                      <p
                        className={`text-sm ${correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}
                      >
                        Your answer: {qi.selectedAnswer}
                      </p>
                      <p className="text-sm">Correct answer: {qi.correctAnswer}</p>
                    </div>
                  )
                })}
              </div>
            </MotionWrapper>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}
