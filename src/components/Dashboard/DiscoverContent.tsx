'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Compass, Video } from 'lucide-react'

import type { AcademicLevel, Subject } from '@/payload-types'
import type {
  RecommendedBook,
  RecommendedVideo,
} from '@/services/contentRecommendations'

interface DiscoverContentProps {
  preferredSubjectCount: number
  recommendedBooks: RecommendedBook[]
  recommendedVideos: RecommendedVideo[]
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject || typeof subject === 'string') return ''
  return subject.name ?? ''
}

function getSubjectSlug(subject: string | Subject | null | undefined): string {
  if (!subject || typeof subject === 'string') return ''
  return subject.slug ?? ''
}

function getLevelName(level: string | AcademicLevel | null | undefined): string {
  if (!level || typeof level === 'string') return ''
  return level.name ?? ''
}

export default function DiscoverContent({
  preferredSubjectCount,
  recommendedBooks,
  recommendedVideos,
}: DiscoverContentProps) {
  if (preferredSubjectCount === 0) return null

  const recommendations = [
    ...recommendedVideos.map((content) => ({ content, type: 'video' as const })),
    ...recommendedBooks.map((content) => ({ content, type: 'book' as const })),
  ]
    .sort(
      (left, right) =>
        new Date(right.content.createdAt).getTime() - new Date(left.content.createdAt).getTime(),
    )
    .slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Recommended for your subjects</h2>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map(({ content, type }, index) => {
            const subjectSlug = getSubjectSlug(content.subject)
            const isVideo = type === 'video'
            const href = subjectSlug
              ? `/dashboard/${isVideo ? 'videos' : 'library'}/${subjectSlug}`
              : `/dashboard/${isVideo ? 'videos' : 'library'}`

            return (
              <motion.div
                key={`${type}-${content.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Link
                  href={href}
                  className="group block rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 rounded-lg p-2.5 ${isVideo ? 'bg-red-500/10' : 'bg-green-500/10'}`}
                    >
                      {isVideo ? (
                        <Video className="h-5 w-5 text-red-500" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {content.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          getSubjectName(content.subject),
                          isVideo
                            ? getLevelName(content.academicLevel)
                            : (content as RecommendedBook).author,
                        ]
                          .filter(Boolean)
                          .join(' · ') || (isVideo ? 'Video Lesson' : 'Book')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {isVideo ? 'Start Watching' : 'Start Reading'}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          No new videos or books are available for your selected subjects yet.
        </div>
      )}
    </motion.div>
  )
}
