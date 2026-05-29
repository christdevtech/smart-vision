'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Crown,
  Lock,
  Download,
  BookOpen,
  Clock,
  Award,
  Filter,
  X,
  ChevronDown,
  Eye,
} from 'lucide-react'
import type { ExamPaper, Subject, Media, User } from '@/payload-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getMediaUrl(media: string | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'string') return null
  return media.url ?? null
}

function getMediaThumbnailUrl(media: string | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'string') return null
  // Prefer the 'small' size for card thumbnails, fall back to URL
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
  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [paperNumberFilter, setPaperNumberFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [accessFilter, setAccessFilter] = useState<AccessTier>('all')

  // Selected paper for inline viewer
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const [showAnswerKey, setShowAnswerKey] = useState(false)

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
      // Subject filter
      if (subjectFilter && getSubjectId(paper.subject) !== subjectFilter) return false

      // Paper number filter
      if (paperNumberFilter && paper.paperType !== paperNumberFilter) return false

      // Year filter
      if (yearFilter && paper.year !== parseInt(yearFilter)) return false

      // Access tier filter
      if (accessFilter === 'free') {
        if (paper.subscriptionRequired) return false
      }
      if (accessFilter === 'premium') {
        if (!paper.subscriptionRequired) return false
      }

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

  const selectedPaper = selectedPaperId
    ? examPapers.find((p) => p.id === selectedPaperId)
    : null

  const isPremiumPaper = (paper: ExamPaper) => !!paper.subscriptionRequired
  const canAccessPaper = (paper: ExamPaper) =>
    !paper.subscriptionRequired || subscriptionActive

  function handlePaperClick(paper: ExamPaper) {
    if (selectedPaperId === paper.id) {
      // Toggle off
      setSelectedPaperId(null)
      setShowAnswerKey(false)
    } else {
      setSelectedPaperId(paper.id)
      setShowAnswerKey(false)
    }
  }

  function clearFilters() {
    setSubjectFilter('')
    setPaperNumberFilter('')
    setYearFilter('')
    setAccessFilter('all')
  }

  const hasActiveFilters = subjectFilter || paperNumberFilter || yearFilter || accessFilter !== 'all'

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
                  {tier === 'premium' ? '👑' : ''} {tier}
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
            const accessible = canAccessPaper(paper)
            const isSelected = selectedPaperId === paper.id
            const subName = getSubjectName(paper.subject)

            return (
              <motion.button
                key={paper.id}
                onClick={() => handlePaperClick(paper)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col rounded-2xl border overflow-hidden text-left transition-all
                  ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  }
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

      {/* ---- Inline PDF Viewer (expanded below grid) ---- */}
      <AnimatePresence>
        {selectedPaper && (
          <motion.div
            key={selectedPaper.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-input overflow-hidden">
              {/* Viewer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedPaper.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSubjectName(selectedPaper.subject)} ·{' '}
                      {paperNumberLabel(selectedPaper.paperType)} · {selectedPaper.year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Download button — only for non-protected papers + subscribed users */}
                  {!selectedPaper.isProtected && subscriptionActive && (
                    <a
                      href={getMediaUrl(selectedPaper.pdf) ?? '#'}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}

                  {/* Answer key toggle */}
                  {selectedPaper.hasAnswerKey && selectedPaper.answerKeyPdf && (
                    <button
                      onClick={() => {
                        if (!subscriptionActive) {
                          // Redirect to subscription page
                          window.location.href = '/dashboard/subscriptions'
                          return
                        }
                        setShowAnswerKey((v) => !v)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${
                          showAnswerKey
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : subscriptionActive
                              ? 'bg-secondary text-foreground hover:bg-accent'
                              : 'bg-amber-500/10 text-amber-600'
                        }`}
                    >
                      {!subscriptionActive && <Lock className="w-3 h-3" />}
                      <BookOpen className="w-3.5 h-3.5" />
                      {showAnswerKey ? 'Hide Answers' : 'Reveal Answers'}
                    </button>
                  )}

                  {/* Close viewer */}
                  <button
                    onClick={() => {
                      setSelectedPaperId(null)
                      setShowAnswerKey(false)
                    }}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PDF content */}
              {canAccessPaper(selectedPaper) ? (
                <div
                  className="relative"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ userSelect: 'none' }}
                >
                  {/* Main PDF or Answer Key */}
                  <object
                    key={showAnswerKey ? 'answer' : 'paper'}
                    data={`${
                      showAnswerKey
                        ? getMediaUrl(selectedPaper.answerKeyPdf)
                        : getMediaUrl(selectedPaper.pdf)
                    }#toolbar=0&navpanes=0&scrollbar=1`}
                    type="application/pdf"
                    className="w-full"
                    style={{ height: '75vh', minHeight: '500px' }}
                  >
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <FileText className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Unable to display PDF inline.
                      </p>
                      {!selectedPaper.isProtected && subscriptionActive && (
                        <a
                          href={getMediaUrl(selectedPaper.pdf) ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Open in new tab
                        </a>
                      )}
                    </div>
                  </object>

                  {/* Answer key label */}
                  {showAnswerKey && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-medium shadow-sm">
                      📝 Answer Key
                    </div>
                  )}
                </div>
              ) : (
                /* Subscription gate for premium papers */
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Premium Content</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Subscribe to access this exam paper and all premium content.
                    </p>
                  </div>
                  <a
                    href="/dashboard/subscriptions"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    Subscribe Now
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
