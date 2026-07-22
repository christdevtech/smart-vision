'use client'

import { cn } from '@/utilities/ui'
import React, { useEffect, useRef } from 'react'

import type { Props as MediaProps } from '../types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

export const VideoMedia: React.FC<MediaProps> = (props) => {
  const { onClick, resource, src: srcFromProps, videoClassName } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  // const [showFallback] = useState<boolean>()

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {
        // setShowFallback(true);
        // console.warn('Video was suspended, rendering fallback image.')
      })
    }
  }, [])

  if (srcFromProps) {
    return (
      <video className={cn(videoClassName)} controls onClick={onClick} playsInline ref={videoRef}>
        <source src={typeof srcFromProps === 'string' ? srcFromProps : srcFromProps.src} />
      </video>
    )
  }

  if (resource && typeof resource === 'object') {
    const { filename } = resource

    return (
      <video
        className={cn(videoClassName)}
        controls
        onClick={onClick}
        playsInline
        ref={videoRef}
      >
        <source src={getMediaUrl(`/api/media/file/${encodeURIComponent(filename ?? '')}`)} />
      </video>
    )
  }

  return null
}
