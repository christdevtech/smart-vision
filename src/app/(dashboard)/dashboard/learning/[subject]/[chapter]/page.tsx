import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Book } from 'lucide-react'
import config from '@/payload.config'
import Link from 'next/link'
import { Subject, Topic, Mcq, Video, Book as BookType } from '@/payload-types'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ subject: string; chapter: string }>
}) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const { subject: subjectParam, chapter: chapterParam } = await params

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
  async function resolveTopic(): Promise<Topic | null> {
    const bySlug = await payload.find({
      collection: 'topics',
      where: { slug: { equals: chapterParam } },
      limit: 1,
    })
    const slugDoc = (bySlug.docs?.[0] as Topic) || null
    if (slugDoc) return slugDoc
    const byId = await payload.find({
      collection: 'topics',
      where: { id: { equals: chapterParam } },
      limit: 1,
    })
    return (byId.docs?.[0] as Topic) || null
  }

  const subject = await resolveSubject()
  const topic = await resolveTopic()
  if (!subject || !topic) {
    redirect('/dashboard/learning')
  }

  const mcqRes = await payload.find({
    collection: 'mcq',
    where: { subject: { equals: subject.id } },
    limit: 200,
  })
  const mcqs = (mcqRes.docs as Mcq[]).filter((q) =>
    (q.topic || []).some((t) => (typeof t === 'string' ? t : (t as any).id) === topic.id),
  )

  const videosRes = await payload.find({
    collection: 'videos',
    where: { subject: { equals: subject.id } },
    limit: 50,
  })
  const videos = (videosRes.docs as Video[]).filter((v) =>
    (v.topic || []).some((t) => (typeof t === 'string' ? t : (t as any).id) === topic.id),
  )

  const booksRes = await payload.find({
    collection: 'books',
    where: { subject: { equals: subject.id } },
    limit: 50,
  })
  const books = booksRes.docs as BookType[]

  return (
    <DashboardLayout user={user} title="Learning Hub">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Book className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {(subject as any).name || subject.slug || subject.id} —{' '}
                    {(topic as any).name || topic.slug || topic.id}
                  </h1>
                  <p className="text-lg text-muted-foreground">Chapter content and lessons</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border bg-card border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-foreground">Practice MCQs</p>
                  <Link
                    href="/dashboard/testing"
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    Start
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  {mcqs.length} questions available for this topic
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card border-border/50">
                <p className="mb-3 font-medium text-foreground">Videos</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {videos.map((v) => (
                    <Link
                      key={v.id}
                      href={`/dashboard/videos/watch/${v.id}`}
                      className="p-3 rounded-xl border transition-colors bg-input border-border hover:bg-accent"
                    >
                      <p className="font-medium text-foreground">{(v as any).title || v.id}</p>
                      <p className="text-sm text-muted-foreground">Tap to watch</p>
                    </Link>
                  ))}
                  {!videos.length && (
                    <div className="p-3 rounded-xl border bg-input border-border">
                      <p className="text-sm text-muted-foreground">No videos for this topic yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-card border-border/50">
                <p className="mb-3 font-medium text-foreground">Books</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {books
                    .filter(
                      (b) => (b.subject as any)?.id === subject.id || b.subject === subject.id,
                    )
                    .map((b) => (
                      <Link
                        key={b.id}
                        href={`/dashboard/library/read/${b.id}`}
                        className="p-3 rounded-xl border transition-colors bg-input border-border hover:bg-accent"
                      >
                        <p className="font-medium text-foreground">{(b as any).title || b.id}</p>
                        <p className="text-sm text-muted-foreground">Tap to read</p>
                      </Link>
                    ))}
                  {!books.length && (
                    <div className="p-3 rounded-xl border bg-input border-border">
                      <p className="text-sm text-muted-foreground">No books for this topic yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
