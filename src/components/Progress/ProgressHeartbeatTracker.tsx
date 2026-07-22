'use client'

import React from 'react'
import {
  PROGRESS_HEARTBEAT_COOLDOWN_MS,
  PROGRESS_HEARTBEAT_INTERVAL_MS,
  type ProgressContentType,
} from '@/services/progressHeartbeat'

const HEARTBEAT_ENDPOINT = '/api/custom/progress/heartbeat'

const createHeartbeatId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function ProgressHeartbeatTracker({
  contentId,
  contentType,
}: {
  contentId: string
  contentType: ProgressContentType
}) {
  React.useEffect(() => {
    let lastSentAt = Date.now()

    const sendHeartbeat = (preferBeacon: boolean) => {
      const now = Date.now()
      if (now - lastSentAt < PROGRESS_HEARTBEAT_COOLDOWN_MS) return

      lastSentAt = now
      const body = JSON.stringify({
        contentId,
        contentType,
        heartbeatId: createHeartbeatId(),
      })

      if (
        preferBeacon &&
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon(
          HEARTBEAT_ENDPOINT,
          new Blob([body], { type: 'application/json' }),
        )
      ) {
        return
      }

      void fetch(HEARTBEAT_ENDPOINT, {
        method: 'POST',
        body,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        keepalive: preferBeacon,
      }).catch(() => undefined)
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') sendHeartbeat(false)
    }, PROGRESS_HEARTBEAT_INTERVAL_MS)
    const flush = () => sendHeartbeat(true)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flush)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [contentId, contentType])

  return null
}
