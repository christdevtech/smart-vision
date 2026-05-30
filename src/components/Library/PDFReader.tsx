'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const ProtectedPDFViewer = dynamic(() => import('@/components/QuestionBank/ProtectedPDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 gap-3 border rounded-xl bg-card">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading viewer…</p>
    </div>
  ),
})

export default function PDFReader({
  pdfUrl,
}: {
  pdfUrl: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <ProtectedPDFViewer url={pdfUrl} />
    </div>
  )
}
