'use client'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import '../styles.css'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props
  const router = useRouter()

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <Link href="/" className="smartvision-brand-logo">
      <img
        onClick={() => router.push('/')}
        alt="Smart Vision Logo"
        width={50}
        height={50}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className={clsx('smartvision-brand-logo__image', className)}
        src="/favicon.png"
      />
      <span className="smartvision-brand-logo__name">SmartVision</span>
    </Link>
  )
}
