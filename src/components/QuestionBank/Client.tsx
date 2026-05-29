'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Crown,
  Lock,
  Clock,
  Award,
  Filter,
  X,
} from 'lucide-react'
import type { ExamPaper, Subject, Media, User } from '@/payload-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function paperNumberLabel(paperType: string): string {
  return `Paper ${paperType}`
}

type AccessTier = 'all' | 'free' | 'premium'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuestionBankClient({
  examPapers,
  subjects,
  user,
  subscriptionActive,
}: {
  examPapers: ExamPaper[]
  subjects: Subject[]
  user: User
  subscriptionActive: boolean
}) {
  const router = useRouter()

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [paperNumberFilter, setPaperNumberFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [accessFilter, setAccessFilter] = useState<AccessTier>('all')

  // Available filter options derived from data
  const availableYears = useMemo(() => {
    const years = [...new Set(examPapers.map((p) => p.year))].sort((a, b) => b - a)
    return years
  }, [examPapers])

  const availableSubjects = useMemo(() => {
    const subjectIds = [...new Set(examPapers.map((p) => getSubjectId(p.subject)))]
    return subjects.filter((s) => subjectIds.includes(s.id))
  }, [examPapers, subjects])

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return examPapers.filter((paper) => {
      if (subjectFilter && getSubjectId(paper.subject) !== subjectFilter) return false
      if (paperNumberFilter && paper.paperType !== paperNumberFilter) return false
      if (yearFilter && paper.year !== parseInt(yearFilter)) return false
      if (accessFilter === 'free' && paper.subscriptionRequired) return false
      if (accessFilter === 'premium' && !paper.subscriptionRequired) return false
      return true
    })
  }, [examPapers, subjectFilter, paperNumberFilter, yearFilter, accessFilter])

  // Sort: by subject name → paper number → year desc
  const sortedPapers = useMemo(() => {
    return [...filteredPapers].sort((a, b) => {
      const sa = getSubjectName(a.subject)
      const sb = getSubjectName(b.subject)
      if (sa !== sb) return sa.localeCompare(sb)
      if (a.paperType !== b.paperType) return a.paperType.localeCompare(b.paperType)
      return b.year - a.year
    })
  }, [filteredPapers])

  const isPremiumPaper = (paper: ExamPaper) => !!paper.subscriptionRequired

  function handlePaperClick(paper: ExamPaper) {
    // Premium papers for non-subscribed users → subscription page
    if (isPremiumPaper(paper) && !subscriptionActive) {
      router.push('/dashboard/subscriptions')
      return
    }
    // Navigate to the dedicated viewer page
    router.push(`/dashboard/question-bank/${paper.id}`)
  }

  function clearFilters() {
    setSubjectFilter('')
    setPaperNumberFilter('')
    setYearFilter('')
    setAccessFilter('all')
  }

  const hasActiveFilters =
    subjectFilter || paperNumberFilter || yearFilter || accessFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* ---- Filter bar ---- */}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Subject */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background border-border text-foreground text-sm"
            >
              <option value="">All subjects</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paper Number */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Paper Number</label>
            <select
              value={paperNumberFilter}
              onChange={(e) => setPaperNumberFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background border-border text-foreground text-sm"
            >
              <option value="">All papers</option>
              <option value="1">Paper 1</option>
              <option value="2">Paper 2</option>
              <option value="3">Paper 3</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background border-border text-foreground text-sm"
            >
              <option value="">All years</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Access tier toggle */}
          <div>
            <label className="block mb-1 text-xs text-muted-foreground">Access</label>
            <div className="flex rounded-lg border border-border overflow-hidden h-[38px]">
              {(['all', 'free', 'premium'] as AccessTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setAccessFilter(tier)}
                  className={`flex-1 text-xs font-medium capitalize transition-colors
                    ${
                      accessFilter === tier
                        ? tier === 'premium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-accent'
                    }`}
                >
                  {tier === 'premium' ? '👑 ' : ''}{tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Results count ---- */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedPapers.length} paper{sortedPapers.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* ---- Paper grid ---- */}
      {sortedPapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border bg-input text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No exam papers match your filters. Try adjusting the filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedPapers.map((paper) => {
            const thumbnailUrl = getMediaThumbnailUrl((paper as any).thumbnail)
            const premium = isPremiumPaper(paper)
            const accessible = !premium || subscriptionActive
            const subName = getSubjectName(paper.subject)

            return (
              <motion.button
                key={paper.id}
                onClick={() => handlePaperClick(paper)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col rounded-2xl border overflow-hidden text-left transition-all border-border hover:border-primary/40
                  ${!accessible ? 'opacity-75' : ''}
                `}
              >
                {/* Thumbnail / Placeholder */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={paper.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full px-3 text-center">
                      <FileText className="w-10 h-10 text-primary/30 mb-2" />
                      <span className="text-xs text-muted-foreground font-medium leading-tight">
                        {subName}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {paperNumberLabel(paper.paperType)} · {paper.year}
                      </span>
                    </div>
                  )}

                  {/* Premium crown badge */}
                  {premium && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/90 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* Lock overlay for inaccessible papers */}
                  {!accessible && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Subscribe
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div className="p-3 bg-input border-t border-border space-y-1">
                  <p className="text-sm font-medium text-foreground truncate">{subName}</p>
                  <p className="text-xs text-muted-foreground">
                    {paperNumberLabel(paper.paperType)} · {paper.year}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {paper.duration && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {paper.duration} min
                      </span>
                    )}
                    {paper.totalMarks && (
                      <span className="flex items-center gap-0.5">
                        <Award className="w-3 h-3" />
                        {paper.totalMarks} marks
                      </span>
                    )}
                  </div>
                  <div className="pt-1">
                    {premium ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                        <Crown className="w-2.5 h-2.5" />
                        PREMIUM
                      </span>
                    ) : (
                      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                        FREE
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
