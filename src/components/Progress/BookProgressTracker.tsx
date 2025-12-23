'use client'

import React from 'react'

export default function BookProgressTracker({
  userId,
  contentId,
  subjectId,
}: {
  userId: string
  contentId: string
  subjectId?: string
}) {
  const [seconds, setSeconds] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      const minutes = Math.max(0, Math.round(seconds / 60))
      const body = {
        user: userId,
        contentType: 'book',
        contentId,
        subject: subjectId || null,
        timeSpent: minutes,
        lastAccessed: new Date().toISOString(),
      }
      try {
        fetch('/api/user-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } catch {}
    }
  }, [seconds, userId, contentId, subjectId])

  return null
}

