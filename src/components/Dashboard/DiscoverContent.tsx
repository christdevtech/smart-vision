'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Video, BookOpen, ArrowRight, Compass } from 'lucide-react'
import type { Video as VideoType, Book, Subject, AcademicLevel } from '@/payload-types'

interface DiscoverContentProps {
  latestVideos: VideoType[]
  latestBooks: Book[]
}

function getSubjectName(subject: string | Subject | null | undefined): string {
  if (!subject || typeof subject === 'string') return ''
  return subject.name ?? ''
}

function getLevelName(level: string | AcademicLevel | null | undefined): string {
  if (!level || typeof level === 'string') return ''
  return level.name ?? ''
}

export default function DiscoverContent({
  latestVideos,
  latestBooks,
}: DiscoverContentProps) {
  const hasContent = latestVideos.length > 0 || latestBooks.length > 0
  if (!hasContent) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Discover Content</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {latestVideos.slice(0, 3).map((video, i) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          >
            <Link
              href="/dashboard/videos"
              className="block p-4 rounded-xl border bg-card border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10 flex-shrink-0">
                  <Video className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[getSubjectName(video.subject), getLevelName(video.academicLevel)]
                      .filter(Boolean)
                      .join(' · ') || 'Video Lesson'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Start Watching <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}

        {latestBooks.slice(0, 3 - latestVideos.length).map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * (latestVideos.length + i), duration: 0.3 }}
          >
            <Link
              href="/dashboard/library"
              className="block p-4 rounded-xl border bg-card border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-green-500/10 flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[getSubjectName(book.subject), book.author]
                      .filter(Boolean)
                      .join(' · ') || 'Book'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Start Reading <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
