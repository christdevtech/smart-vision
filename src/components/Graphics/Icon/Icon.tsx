'use client'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React from 'react'
import '../styles.css'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Icon = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props
  const router = useRouter()

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <img
      onClick={() => router.push('/')}
      alt="Smart Vision Icon"
      width={150}
      height={150}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('smartvision-brand-icon', className)}
      src="/favicon.png"
    />
  )
}
