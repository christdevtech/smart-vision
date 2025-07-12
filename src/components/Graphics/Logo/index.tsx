'use client'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React from 'react'

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
    /* eslint-disable @next/next/no-img-element */
    <img
      onClick={() => router.push('/')}
      alt="316 Group Logo"
      width={193}
      height={34}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[15.375rem] w-full h-[60px]', className)}
      src="/assets/logo.svg"
    />
  )
}
