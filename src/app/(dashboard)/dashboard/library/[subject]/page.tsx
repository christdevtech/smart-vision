import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import MotionWrapper from '@/components/Dashboard/MotionWrapper'
import { Library } from 'lucide-react'
import { Subject, Book } from '@/payload-types'
import Link from 'next/link'

export default async function SubjectLibraryPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
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
    redirect('/dashboard/library')
  }
  const booksRes = await payload.find({
    collection: 'books',
    where: { subject: { equals: subject.id } },
    limit: 100,
  })
  const books = booksRes.docs as Book[]

  return (
    <DashboardLayout user={user} title="Digital Library">
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto space-y-8">
          <MotionWrapper animation="fadeIn" delay={0.1}>
            <div className="p-6 bg-gradient-to-r to-transparent rounded-2xl border from-primary/10 via-primary/5 border-border/50">
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-full from-primary to-secondary">
                  <Library className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {(subject as any).name || subject.slug || subject.id}
                  </h1>
                  <p className="text-lg text-muted-foreground">Browse PDF books</p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper animation="fadeIn" delay={0.2}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/library/read/${b.id}`}
                  className="p-3 rounded-xl border transition-colors bg-card border-border hover:bg-accent"
                >
                  <p className="font-medium text-foreground">{(b as any).title || b.id}</p>
                  <p className="text-sm text-muted-foreground">Tap to read</p>
                </Link>
              ))}
              {!books.length && (
                <div className="p-6 rounded-2xl border bg-card border-border/50">
                  <p className="text-muted-foreground">No books available for this subject.</p>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </DashboardLayout>
  )
}
