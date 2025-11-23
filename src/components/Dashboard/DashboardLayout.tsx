'use client'

import { ReactNode, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@/payload-types'
import { useNotifications } from '@/utilities/useNotifications'
import SidebarNavigation from './SidebarNavigation'
import NavigationMenu from './NavigationMenu'
import { NotificationCenter } from './NotificationCenter'
import PageTransition from './PageTransition'
import MotionWrapper from './MotionWrapper'
import { Menu, Bell, ChevronRight, X } from 'lucide-react'
import NotificationBadge from './NotificationBadge'

interface DashboardLayoutProps {
  children: ReactNode
  user?: User | null
  title?: string
  showSidebar?: boolean
  className?: string
}

export default function DashboardLayout({
  children,
  user,
  title,
  showSidebar = true,
  className = '',
}: DashboardLayoutProps) {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { unreadCount } = useNotifications()

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Close sidebar on mobile by default
      if (mobile) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const openMenu = () => setIsMenuOpen(true)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="flex overflow-hidden h-screen bg-background">
      {/* Sidebar Navigation - Full Height */}
      {showSidebar && (
        <SidebarNavigation
          notificationCount={unreadCount}
          isOpen={isSidebarOpen || !isMobile}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 h-screen ${showSidebar && !isMobile ? 'ml-0' : ''}`}>
        {/* Enhanced Header with Dashboard Features */}
        <motion.header
          className="z-40 flex-shrink-0 border-b shadow-sm bg-card border-border"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-center px-4 py-3 mx-auto max-w-7xl">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle Button */}
              {showSidebar && (
                <motion.button
                  className="flex justify-center items-center w-10 h-10 bg-transparent rounded-lg md:hidden text-muted-foreground hover:bg-accent"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <AnimatePresence mode="wait">
                    {isSidebarOpen ? (
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
              )}

              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.02 }}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-sm"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="#4F46E5"
                      stroke="#6366F1"
                      strokeWidth="2"
                    />
                    <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
                    <circle cx="75" cy="25" r="8" fill="#10B981" />
                    <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                  <span className="text-xl font-bold text-foreground">SmartVision</span>
                </motion.div>

                {title && (
                  <div className="hidden md:block">
                    <span className="text-muted-foreground">|</span>
                    <span className="ml-3 text-lg font-medium text-foreground">{title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Section - Title (Desktop) */}
            <div className="hidden items-center space-x-2 text-sm lg:flex">
              {title && <span className="font-medium text-foreground">{title}</span>}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notification Button */}
              <motion.button
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setIsNotificationCenterOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <NotificationBadge count={unreadCount} variant="number" color="red" pulse />
                  </div>
                )}
              </motion.button>

              {/* User Info */}
              {user && (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-foreground">
                      {user.firstName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br rounded-full from-primary to-secondary">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className={`overflow-y-auto flex-1 ${className}`}>
          <PageTransition>
            <MotionWrapper animation="fadeIn" className="min-h-full">
              {children}
            </MotionWrapper>
          </PageTransition>
        </main>
      </div>

      {/* Mobile Navigation Menu (Fallback) */}
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        variant="drawer"
        notificationCount={unreadCount}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  )
}
