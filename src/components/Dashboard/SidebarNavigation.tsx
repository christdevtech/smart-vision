'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Bell, User, Settings, Menu, X, ChevronRight } from 'lucide-react'
import NavigationItem from './NavigationItem'
import { navigationAnimations } from './animations/presets'
import { useState, useEffect } from 'react'

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

export default function SidebarNavigation({
  className = '',
  notificationCount = 0,
  isOpen: controlledIsOpen,
  onToggle,
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
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

  // Use controlled state if provided, otherwise use internal state
  // On desktop, default to open unless explicitly controlled
  const isOpen = controlledIsOpen !== undefined 
    ? controlledIsOpen 
    : isMobile 
      ? internalIsOpen 
      : true
  const setIsOpen = onToggle || setInternalIsOpen

  const routes: NavigationRoute[] = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      activeIcon: Home,
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: BarChart3,
      activeIcon: BarChart3,
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      activeIcon: Bell,
      badge: notificationCount,
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: User,
      activeIcon: User,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      activeIcon: Settings,
    },
  ]

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }, [pathname, setIsOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setIsOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        className="fixed top-4 left-4 z-50 flex md:hidden justify-center items-center w-10 h-10 text-muted-foreground bg-card rounded-lg shadow-lg border border-border"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.nav
          className={`fixed top-0 left-0 z-50 h-full bg-card border-r border-border shadow-lg ${className} ${
            !isMobile ? 'md:relative md:z-auto' : ''
          }`}
          variants={navigationAnimations.sidebarSlide}
          initial={isMobile ? "initial" : "animate"}
          animate={isOpen ? 'animate' : 'initial'}
          style={{
            width: isOpen ? '280px' : isMobile ? '0px' : '280px',
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
              className="flex md:hidden justify-center items-center w-8 h-8 text-muted-foreground rounded-lg hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Navigation Items */}
          <div className="flex relative flex-col p-4 space-y-2">
            {routes.map((route, index) => {
              const isActive = isRouteActive(route.href)
              const IconComponent = isActive ? route.activeIcon : route.icon

              return (
                <motion.div
                  key={route.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    x: isOpen ? 0 : -20,
                  }}
                  transition={{
                    delay: isOpen ? index * 0.1 + 0.2 : 0,
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
                    badge={route.badge}
                    variant="sidebar"
                    className="w-full justify-start px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                  />
                </motion.div>
              )
            })}
          </div>

          {/* Active route indicator */}
          <motion.div
            className="absolute left-0 w-1 bg-primary rounded-r-full"
            layoutId="sidebarIndicator"
            style={{
              height: '40px',
              top: `${88 + routes.findIndex((route) => isRouteActive(route.href)) * 48}px`,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />

          {/* Collapse/Expand Button for Desktop */}
          <motion.button
            className="hidden md:flex absolute -right-3 top-20 justify-center items-center w-6 h-6 text-muted-foreground bg-card rounded-full border border-border shadow-sm hover:text-foreground"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </motion.nav>
      </AnimatePresence>
    </>
  )
}