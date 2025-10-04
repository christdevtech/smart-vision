'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  BarChart3,
  Bell,
  User,
  Settings,
  FileText,
  Image,
  Users,
  ShoppingBag,
  ChevronDown,
  X,
  GitCommitHorizontal,
  LucideListOrdered,
} from 'lucide-react'
import NavigationItem from './NavigationItem'
import { navigationAnimations } from './animations/presets'

interface NavigationSection {
  title: string
  items: NavigationRoute[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

interface NavigationRoute {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavigationRoute[]
}

interface NavigationMenuProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  variant?: 'sidebar' | 'drawer'
  notificationCount?: number
}

export default function NavigationMenu({
  isOpen,
  onClose,
  className = '',
  variant = 'drawer',
  notificationCount = 0,
}: NavigationMenuProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(['main'])

  const navigationSections: NavigationSection[] = [
    {
      title: 'Main',
      defaultExpanded: true,
      items: [
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: Home,
        },
        {
          href: '/dashboard/analytics',
          label: 'Analytics',
          icon: BarChart3,
        },
        {
          href: '/dashboard/notifications',
          label: 'Notifications',
          icon: Bell,
          badge: notificationCount,
        },
      ],
    },
    {
      title: 'Content',
      collapsible: true,
      defaultExpanded: false,
      items: [
        {
          href: '/dashboard/content',
          label: 'All Content',
          icon: FileText,
        },
        {
          href: '/dashboard/media',
          label: 'Media Library',
          icon: Image,
        },
        {
          href: '/dashboard/pages',
          label: 'Pages',
          icon: GitCommitHorizontal,
        },
      ],
    },
    {
      title: 'E-commerce',
      collapsible: true,
      defaultExpanded: false,
      items: [
        {
          href: '/dashboard/products',
          label: 'Products',
          icon: ShoppingBag,
        },
        {
          href: '/dashboard/orders',
          label: 'Orders',
          icon: LucideListOrdered,
        },
      ],
    },
    {
      title: 'User Management',
      collapsible: true,
      defaultExpanded: false,
      items: [
        {
          href: '/dashboard/users',
          label: 'Users',
          icon: Users,
        },
        {
          href: '/dashboard/profile',
          label: 'Profile',
          icon: User,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          href: '/dashboard/settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ]

  // Initialize expanded sections
  useEffect(() => {
    const defaultExpanded = navigationSections
      .filter((section) => section.defaultExpanded)
      .map((section) => section.title.toLowerCase())
    setExpandedSections(defaultExpanded)
  }, [])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle],
    )
  }

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const isSectionActive = (items: NavigationRoute[]) => {
    return items.some((item) => isRouteActive(item.href))
  }

  const menuContent = (
    <motion.div
      className={`
        ${variant === 'sidebar' ? 'relative' : 'fixed inset-y-0 left-0 z-50'}
        w-80 bg-card shadow-xl
        flex flex-col
        ${className}
      `}
      variants={navigationAnimations.menuExpand}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      exit="closed"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
        {variant === 'drawer' && (
          <motion.button
            className="p-2 text-muted-foreground rounded-lg hover:text-foreground hover:bg-accent"
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Navigation Content */}
      <div className="overflow-y-auto flex-1 py-4">
        {navigationSections.map((section, sectionIndex) => {
          const sectionKey = section.title.toLowerCase()
          const isExpanded = expandedSections.includes(sectionKey)
          const hasActiveItem = isSectionActive(section.items)

          return (
            <motion.div
              key={section.title}
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              {/* Section Header */}
              <div className="px-4 mb-2">
                {section.collapsible ? (
                  <motion.button
                    className={`
                      flex items-center justify-between w-full
                      text-xs font-semibold uppercase tracking-wider
                      ${hasActiveItem ? 'text-primary' : 'text-muted-foreground'}
                      hover:text-primary transition-colors duration-200
                    `}
                    onClick={() => toggleSection(sectionKey)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{section.title}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                ) : (
                  <h3
                    className={`
                    text-xs font-semibold uppercase tracking-wider
                    ${hasActiveItem ? 'text-primary' : 'text-muted-foreground'}
                  `}
                  >
                    {section.title}
                  </h3>
                )}
              </div>

              {/* Section Items */}
              <AnimatePresence>
                {(!section.collapsible || isExpanded) && (
                  <motion.div
                    className="px-2 space-y-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {section.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                      >
                        <NavigationItem
                          href={item.href}
                          icon={<item.icon className="w-5 h-5" />}
                          label={item.label}
                          isActive={isRouteActive(item.href)}
                          badge={item.badge}
                          variant="sidebar"
                          onClick={variant === 'drawer' ? onClose : undefined}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-center text-muted-foreground">Smart Vision Dashboard</div>
      </div>
    </motion.div>
  )

  if (variant === 'sidebar') {
    return menuContent
  }

  // Drawer variant with overlay
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu */}
          {menuContent}
        </>
      )}
    </AnimatePresence>
  )
}
