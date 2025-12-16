'use client'

import React from 'react'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export default function PDFReader({
  filename,
}: {
  filename: string
}) {
  const src = getMediaUrl(`/media/${filename}`)
  return (
    <div className="w-full h-[70vh] rounded-xl overflow-hidden border bg-black border-border">
      <iframe
        src={src}
        className="w-full h-full"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
}

