'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// react-pdf v9 uses pdfjs-dist v4 — use the matching CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface ProtectedPDFViewerProps {
  /** Payload media URL (e.g. /api/media/file/HISTORY.pdf) */
  url: string
}

/**
 * Fetches the PDF as raw bytes on the client, then renders each page
 * as a <canvas> element via react-pdf. Canvas rendering prevents
 * native browser download/save/print interactions.
 *
 * The fetch() API retrieves response bytes regardless of
 * Content-Disposition headers — this is why it works even when
 * the server sends "attachment".
 */
export default function ProtectedPDFViewer({ url }: ProtectedPDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch PDF bytes on mount
  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function loadPdf() {
      setLoading(true)
      setError(null)
      setPdfUrl(null)

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`)

        const json = await res.json()
        if (cancelled) return

        if (!json.data) throw new Error('Invalid PDF data received')

        // Decode Base64 string back into an ArrayBuffer
        const binaryString = window.atob(json.data)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Create a blob URL instead of passing ArrayBuffer directly.
        // This avoids the "detached ArrayBuffer" error in React Strict Mode
        // because pdf.js worker transfers ownership of ArrayBuffers.
        const blob = new Blob([bytes], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load document')
        }
      }
    }

    loadPdf()
    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
  }, [])

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message || 'Failed to render PDF')
    setLoading(false)
  }, [])

  function goToPrev() {
    setPageNumber((p) => Math.max(1, p - 1))
  }
  function goToNext() {
    setPageNumber((p) => Math.min(numPages, p + 1))
  }
  function zoomIn() {
    setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))
  }
  function zoomOut() {
    setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
    >
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-input/50 sticky top-0 z-10">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrev}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg hover:bg-accent text-foreground disabled:opacity-30 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums min-w-[80px] text-center">
            {loading ? '—' : `${pageNumber} / ${numPages}`}
          </span>
          <button
            onClick={goToNext}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg hover:bg-accent text-foreground disabled:opacity-30 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-lg hover:bg-accent text-foreground disabled:opacity-30 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-2 rounded-lg hover:bg-accent text-foreground disabled:opacity-30 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF canvas area */}
      <div
        className="overflow-auto flex justify-center bg-neutral-100 dark:bg-neutral-900/50"
        style={{ height: '75vh', minHeight: '500px' }}
      >
        {loading && !pdfUrl && (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading document…</p>
          </div>
        )}

        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Rendering pages…</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-xl my-4"
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  )
}
