'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'
import { interactiveAnimations, navigationAnimations } from './animations/presets'
import NotificationBadge from './NotificationBadge'

interface NavigationItemProps {
  href: string
  icon: ReactNode
  label: string
  isActive?: boolean
  badge?: number
  disabled?: boolean
  onClick?: () => void
  className?: string
  variant?: 'bottom' | 'sidebar' | 'horizontal'
}

export default function NavigationItem({
  href,
  icon,
  label,
  isActive = false,
  badge,
  disabled = false,
  onClick,
  className = '',
  variant = 'bottom'
}: NavigationItemProps) {
  const baseClasses = `
    relative flex items-center justify-center transition-colors duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `

  const variantClasses = {
    bottom: `
      flex-col space-y-1 p-2 min-h-[60px]
      ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'}
    `,
    sidebar: `
      flex-row space-x-3 p-3 w-full rounded-lg
      ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}
    `,
    horizontal: `
      flex-row space-x-2 px-4 py-2 rounded-lg
      ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'}
    `
  }

  const iconSize = variant === 'bottom' ? 'text-xl' : 'text-lg'
  const labelSize = variant === 'bottom' ? 'text-xs' : 'text-sm'

  const content = (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      variants={interactiveAnimations.cardHover}
      initial="rest"
      whileHover={disabled ? "rest" : "hover"}
      whileTap={disabled ? "rest" : "tap"}
      onClick={disabled ? undefined : onClick}
    >
      {/* Active indicator for bottom navigation */}
      {variant === 'bottom' && isActive && (
        <motion.div
          className="absolute top-0 left-1/2 w-8 h-1 bg-blue-600 rounded-b-full"
          layoutId="activeIndicator"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Active indicator for sidebar */}
      {variant === 'sidebar' && isActive && (
        <motion.div
          className="absolute left-0 top-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
          layoutId="sidebarActiveIndicator"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon container with badge */}
      <div className="relative">
        <motion.div
          className={iconSize}
          variants={navigationAnimations.navItemActive}
          initial="initial"
          animate={isActive ? "animate" : "initial"}
        >
          {icon}
        </motion.div>
        
        {badge && badge > 0 && (
          <div className="absolute -top-1 -right-1">
            <NotificationBadge 
              count={badge} 
              variant="number" 
              color="red" 
              pulse={true}
            />
          </div>
        )}
      </div>

      {/* Label */}
      <motion.span
        className={`${labelSize} font-medium ${variant === 'bottom' ? 'text-center' : ''}`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: isActive ? 1 : 0.8 }}
      >
        {label}
      </motion.span>

      {/* Ripple effect on tap */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-blue-500 opacity-0"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  )

  if (disabled) {
    return content
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}