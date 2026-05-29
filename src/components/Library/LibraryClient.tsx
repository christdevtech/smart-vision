'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Book as BookIcon, Filter, X, Crown, Lock } from 'lucide-react'
import type { Book, Subject, Media, User } from '@/payload-types'

// Helpers
function getMediaThumbnailUrl(media: string | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'string') return null
  return media.sizes?.small?.url ?? media.sizes?.medium?.url ?? media.url ?? null
}

function getSubjectName(subject: string | Subject | undefined | null): string {
  if (!subject) return '—'
  if (typeof subject === 'string') return subject
  return subject.name ?? '—'
}

function getSubjectId(subject: string | Subject | undefined | null): string {
  if (!subject) return ''
  if (typeof subject === 'string') return subject
  return subject.id
}

type AccessTier = 'all' | 'free' | 'premium'

export default function LibraryClient({
  books,
  subjects,
  user,
  subscriptionActive,
}: {
  books: Book[]
  subjects: Subject[]
  user: User
  subscriptionActive: boolean
}) {
  const router = useRouter()

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [accessFilter, setAccessFilter] = useState<AccessTier>('all')

  const availableSubjects = useMemo(() => {
    const subjectIds = [...new Set(books.map((b) => getSubjectId(b.subject)))]
    return subjects.filter((s) => subjectIds.includes(s.id))
  }, [books, subjects])

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (subjectFilter && getSubjectId(book.subject) !== subjectFilter) return false
      if (accessFilter === 'free' && book.subscriptionRequired) return false
      if (accessFilter === 'premium' && !book.subscriptionRequired) return false
      return true
    })
  }, [books, subjectFilter, accessFilter])

  // Sort by subject then title
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const sa = getSubjectName(a.subject)
      const sb = getSubjectName(b.subject)
      if (sa !== sb) return sa.localeCompare(sb)
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [filteredBooks])

  const isPremiumBook = (book: Book) => !!book.subscriptionRequired

  function handleBookClick(book: Book) {
    if (isPremiumBook(book) && !subscriptionActive) {
      router.push('/dashboard/subscriptions')
      return
    }
    router.push(`/dashboard/library/read/${book.id}`)
  }

  function clearFilters() {
    setSubjectFilter('')
    setAccessFilter('all')
  }

  const hasActiveFilters = subjectFilter || accessFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="p-4 rounded-2xl border border-border bg-input space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Subject */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background border-border text-foreground text-sm"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>

          {/* Access */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Access</label>
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as AccessTier)}
              className="w-full px-3 py-2 rounded-lg border bg-background border-border text-foreground text-sm"
            >
              <option value="all">All Books</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {sortedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/50 bg-card/30">
          <BookIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No books found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-primary hover:underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedBooks.map((book, i) => {
            const premium = isPremiumBook(book)
            const locked = premium && !subscriptionActive
            const subjectName = getSubjectName(book.subject)

            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleBookClick(book)}
                className="group relative flex flex-col p-4 rounded-2xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
              >
                {/* Premium badge */}
                {premium && (
                  <div className="absolute top-3 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm backdrop-blur-md">
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Crown className="w-4 h-4" />}
                  </div>
                )}

                {/* Optional thumbnail handling here. If we have PDF thumbnails later we can add them */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <BookIcon className="w-6 h-6" />
                </div>

                <div className="flex flex-col flex-1">
                  <p className="text-xs font-semibold tracking-wider text-primary/80 uppercase mb-1">
                    {subjectName}
                  </p>
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">
                    {book.title || 'Untitled Book'}
                  </h3>
                </div>

                {locked && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background/95 via-background/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full backdrop-blur-md border border-amber-500/20">
                      Requires Subscription
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
