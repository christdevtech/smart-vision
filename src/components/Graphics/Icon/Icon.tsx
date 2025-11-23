'use client'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React from 'react'

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
    /* eslint-disable @next/next/no-img-element */
    <img
      onClick={() => router.push('/')}
      alt="Smart Vision Icon"
      width={150}
      height={150}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('w-full max-w-[150px]', className)}
      src="/favicon.png"
    />
  )
}
