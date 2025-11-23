'use client'
import clsx from 'clsx'
import Link from 'next/link'
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
    <Link href={'/'} className="flex gap-2 justify-center items-center">
      <img
        onClick={() => router.push('/')}
        alt="Smart Vision Logo"
        width={50}
        height={50}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className={clsx('w-full max-w-[50px]', className)}
        src="/favicon.png"
      />
      <span className="hidden text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br md:block from-primary to-success sm:text-xl">
        SmartVision
      </span>
    </Link>
  )
}
