import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { BookOpen } from 'lucide-react'
import config from '@/payload.config'
import Link from 'next/link'
import { Subject, Topic } from '@/payload-types'

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { subject: subjectParam } = await params

  if (!user) {
    redirect('/auth/login')
  }

  async function resolveSubject(): Promise<Subject | null> {
    const bySlug = await payload.find({
      collection: 'subjects',
      where: { slug: { equals: subjectParam } },
      limit: 1,
    })
    const slugDoc = (bySlug.docs?.[0] as Subject) || null
    if (slugDoc) return slugDoc
    const byId = await payload.find({
      collection: 'subjects',
      where: { id: { equals: subjectParam } },
      limit: 1,
    })
    return (byId.docs?.[0] as Subject) || null
  }

  const subject = await resolveSubject()
  if (!subject) {
    redirect('/dashboard/learning')
  }

  const topicsRes = await payload.find({
    collection: 'topics',
    limit: 500,
  })
  const topics = (topicsRes.docs as Topic[]).filter((t) =>
    (t.subjects || []).some((s) => (typeof s === 'string' ? s : (s as any).id) === subject.id),
  )

  return (
    <DashboardLayout user={user} title="Learning Hub">
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
                    {(subject as any).name || subject.slug || subject.id}
                  </h1>
                  <p className="text-lg text-muted-foreground">Browse topics and start learning</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {topics.map((t) => {
                const label = (t as any).name || t.slug || t.id
                const chapterParam = t.slug || t.id
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/learning/${subject.slug || subject.id}/${chapterParam}`}
                    className="p-4 rounded-2xl border bg-card border-border hover:bg-accent transition-colors"
                  >
                    <p className="text-lg font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">Tap to open</p>
                  </Link>
                )
              })}
              {!topics.length && (
                <div className="p-6 rounded-2xl border bg-card border-border/50">
                  <p className="text-muted-foreground">No topics available for this subject yet.</p>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
