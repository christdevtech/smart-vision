'use client'

import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@/payload-types'
import { useNotifications } from '@/utilities/useNotifications'
import { useNavigation } from '@/utilities/useNavigation'
import { Header } from '@/Header/Component'
import SidebarNavigation from './SidebarNavigation'
import NavigationMenu from './NavigationMenu'
import { NotificationCenter } from './NotificationCenter'
import PageTransition from './PageTransition'
import MotionWrapper from './MotionWrapper'
import { Menu, Bell, ChevronRight } from 'lucide-react'
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
  className = ''
}: DashboardLayoutProps) {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const { isMenuOpen, isMobile, breadcrumbs, openMenu, closeMenu } = useNavigation()

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Dashboard Features */}
      <motion.header
        className="sticky top-0 z-40 bg-card border-b border-border shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center px-4 py-3 mx-auto max-w-7xl">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-sm"
                >
                  <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
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

          {/* Center Section - Breadcrumbs (Desktop) */}
          <div className="hidden items-center space-x-2 text-sm lg:flex">
            {breadcrumbs.map((crumb, index) => (
              <motion.div
                key={crumb.href || crumb.label}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {index > 0 && <span className="text-muted-foreground">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notification Button */}
            <motion.button
              className="relative p-2 text-muted-foreground rounded-lg hover:text-foreground hover:bg-accent"
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
                <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Layout Container */}
      <div className="flex">
        {/* Sidebar Navigation */}
        {showSidebar && (
          <SidebarNavigation
            notificationCount={unreadCount}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'md:ml-0' : ''} ${className}`}>
        <PageTransition>
          <MotionWrapper
            animation="fadeIn"
            className="min-h-screen"
          >
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