'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  FileText,
  Play,
  Library,
  Calendar,
  BarChart3,
  User,
  Users,
  Download,
  Crown,
  FileQuestion,
  X,
  ChevronRight,
} from 'lucide-react'
import NavigationItem from './NavigationItem'
import { navigationAnimations } from './animations/presets'
import { useState, useEffect, useRef, useMemo } from 'react'

interface NavigationRoute {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface SidebarNavigationProps {
  className?: string
  notificationCount?: number
  isOpen?: boolean
  onToggle?: () => void
}

export function SidebarNavigation({
  isOpen,
  onToggle,
  notificationCount = 0,
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const [activeItemPosition, setActiveItemPosition] = useState({ top: 0, height: 48 })
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Memoize routes to prevent recreation on every render
  const routes: NavigationRoute[] = useMemo(
    () => [
      {
        href: '/dashboard',
        label: 'User Dashboard',
        icon: Home,
        activeIcon: Home,
      },
      {
        href: '/dashboard/learning',
        label: 'Learning Hub',
        icon: BookOpen,
        activeIcon: BookOpen,
      },
      {
        href: '/dashboard/testing',
        label: 'Testing Center',
        icon: FileText,
        activeIcon: FileText,
      },
      {
        href: '/dashboard/question-bank',
        label: 'Question Bank',
        icon: FileQuestion,
        activeIcon: FileQuestion,
      },
      {
        href: '/dashboard/videos',
        label: 'Video Library',
        icon: Play,
        activeIcon: Play,
      },
      {
        href: '/dashboard/library',
        label: 'Digital Library',
        icon: Library,
        activeIcon: Library,
      },
      {
        href: '/dashboard/downloads',
        label: 'Downloads',
        icon: Download,
        activeIcon: Download,
      },
      {
        href: '/dashboard/planner',
        label: 'Study Planner',
        icon: Calendar,
        activeIcon: Calendar,
      },
      {
        href: '/dashboard/progress',
        label: 'Progress Tracking',
        icon: BarChart3,
        activeIcon: BarChart3,
      },
      {
        href: '/dashboard/referrals',
        label: 'Referrals',
        icon: Users,
        activeIcon: Users,
      },
      {
        href: '/dashboard/subscriptions',
        label: 'Subscriptions',
        icon: Crown,
        activeIcon: Crown,
      },
      {
        href: '/dashboard/account',
        label: 'Account Management',
        icon: User,
        activeIcon: User,
      },
    ],
    [],
  )

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Calculate active item position with proper conditions
  useEffect(() => {
    const activeIndex = routes.findIndex((route) => isRouteActive(route.href))
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      const activeElement = itemRefs.current[activeIndex]
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect()
        const containerRect = activeElement.parentElement?.getBoundingClientRect()
        if (containerRect) {
          const newPosition = {
            top: rect.top - containerRect.top,
            height: rect.height,
          }
          // Only update if position actually changed to prevent infinite loops
          setActiveItemPosition((prev) => {
            if (prev.top !== newPosition.top || prev.height !== newPosition.height) {
              return newPosition
            }
            return prev
          })
        }
      }
    }
  }, [pathname, isOpen, routes])

  // Close sidebar on route change for mobile
  // useEffect(() => {
  //   if (isMobile && onToggle) {
  //     onToggle()
  //   }
  // }, [pathname, isMobile])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onToggle) {
        onToggle()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onToggle])

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onToggle && onToggle()}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.nav
            className={`${isMobile ? 'fixed top-0 left-0 z-40 h-screen' : 'relative h-screen'} bg-card border-r border-border shadow-lg`}
            variants={navigationAnimations.sidebarSlide}
            initial={isMobile ? 'initial' : 'animate'}
            animate={isOpen ? 'animate' : 'initial'}
            exit={isMobile ? 'initial' : undefined}
            style={{
              width: isOpen || !isMobile ? '280px' : '0px',
              overflow: 'hidden',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Background blur effect */}
            <div className="absolute inset-0 backdrop-blur-lg bg-card/95" />

            {/* Sidebar Header */}
            <motion.div
              className="flex relative justify-between items-center p-4 border-b border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold text-foreground">SmartVision</h2>
              <button
                className="flex justify-center items-center w-8 h-8 rounded-lg md:hidden text-muted-foreground hover:bg-accent"
                onClick={() => onToggle && onToggle()}
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Navigation Items */}
            <div className="flex relative flex-col p-4 space-y-2">
              {/* Active indicator positioned at far left */}
              <motion.div
                className="absolute left-0 w-1 rounded-r-full bg-primary"
                layoutId="sidebarActiveIndicator"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{
                  opacity: routes.some((route) => isRouteActive(route.href)) ? 1 : 0,
                  scaleY: 1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  top: `${activeItemPosition.top}px`,
                  height: `${activeItemPosition.height}px`,
                }}
              />

              {routes.map((route, index) => {
                const isActive = isRouteActive(route.href)
                const IconComponent = isActive ? route.activeIcon : route.icon

                return (
                  <motion.div
                    key={route.href}
                    ref={(el) => {
                      itemRefs.current[index] = el
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      x: isOpen ? 0 : -20,
                    }}
                    transition={{
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <NavigationItem
                      href={route.href}
                      icon={<IconComponent className="w-5 h-5" />}
                      label={route.label}
                      isActive={isActive}
                      variant="sidebar"
                      className="px-4 py-3 ml-2"
                      badge={route.badge}
                      onClick={isMobile && onToggle ? onToggle : undefined}
                    />
                  </motion.div>
                )
              })}
            </div>

            {/* Collapse/Expand Button for Desktop */}
            <motion.button
              className="hidden absolute -right-3 top-20 justify-center items-center w-6 h-6 rounded-full border shadow-sm md:flex text-muted-foreground bg-card border-border hover:text-foreground"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggle && onToggle()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

export default SidebarNavigation
