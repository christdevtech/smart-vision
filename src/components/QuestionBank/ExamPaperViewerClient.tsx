'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Download, BookOpen, Lock, Loader2 } from 'lucide-react'

// Dynamic import — react-pdf uses canvas APIs that don't exist on the server
const ProtectedPDFViewer = dynamic(() => import('./ProtectedPDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading viewer…</p>
    </div>
  ),
})

interface ExamPaperViewerClientProps {
  pdfUrl: string
  answerKeyUrl: string | null
  isProtected: boolean
  subscriptionActive: boolean
}

export default function ExamPaperViewerClient({
  pdfUrl,
  answerKeyUrl,
  isProtected,
  subscriptionActive,
}: ExamPaperViewerClientProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(false)

  const activeUrl = showAnswerKey && answerKeyUrl ? answerKeyUrl : pdfUrl

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-input/50">
        <div className="flex items-center gap-2">
          {/* Download — only for non-protected papers + subscribed */}
          {!isProtected && subscriptionActive && (
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Answer key toggle */}
          {answerKeyUrl && (
            <button
              onClick={() => {
                if (!subscriptionActive) {
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
        </div>
      </div>

      {/* Answer key label */}
      {showAnswerKey && (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
          <span className="text-xs font-medium text-emerald-600">
            📝 Viewing Answer Key
          </span>
        </div>
      )}

      {/* PDF Viewer — canvas rendered, no download possible */}
      <ProtectedPDFViewer key={showAnswerKey ? 'answer-key' : 'paper'} url={activeUrl} />
    </div>
  )
}
