'use client'

import { motion } from 'framer-motion'
import { notificationAnimations } from './animations/presets'

interface NotificationBadgeProps {
  count: number
  maxCount?: number
  showZero?: boolean
  variant?: 'default' | 'dot' | 'number'
  color?: 'red' | 'blue' | 'green' | 'yellow'
  pulse?: boolean
  className?: string
}

const colorClasses = {
  red: 'bg-destructive text-destructive-foreground',
  blue: 'bg-primary text-primary-foreground',
  green: 'bg-success text-success-foreground',
  yellow: 'bg-warning text-warning-foreground'
}

export default function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  variant = 'number',
  color = 'red',
  pulse = true,
  className = ''
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) return null

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()
  const shouldPulse = pulse && count > 0

  const badgeClasses = `
    inline-flex items-center justify-center
    ${variant === 'dot' ? 'w-2 h-2' : 'min-w-[1.25rem] h-5 px-1'}
    ${colorClasses[color]}
    ${variant === 'dot' ? 'rounded-full' : 'rounded-full text-xs font-medium'}
    ${className}
  `.trim()

  return (
    <motion.span
      className={badgeClasses}
      initial={{ scale: 0 }}
      animate={{ 
        scale: 1,
        ...(shouldPulse ? notificationAnimations.badgePulse : {})
      }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {variant === 'number' && displayCount}
    </motion.span>
  )
}