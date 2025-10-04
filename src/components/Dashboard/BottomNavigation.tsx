'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { 
  Home,
  BarChart3,
  Bell,
  User,
  Settings,
  Plus
} from 'lucide-react'
import NavigationItem from './NavigationItem'
import { navigationAnimations } from './animations/presets'
import { useState } from 'react'

interface NavigationRoute {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface BottomNavigationProps {
  className?: string
  notificationCount?: number
  showFab?: boolean
  onFabClick?: () => void
}

export default function BottomNavigation({ 
  className = '',
  notificationCount = 0,
  showFab = false,
  onFabClick
}: BottomNavigationProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)

  const routes: NavigationRoute[] = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      activeIcon: Home
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: BarChart3,
      activeIcon: BarChart3
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      activeIcon: Bell,
      badge: notificationCount
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: User,
      activeIcon: User
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      activeIcon: Settings
    }
  ]

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className={`fixed right-0 bottom-0 left-0 z-50 bg-white border-t border-gray-200 safe-area-pb ${className}`}
          variants={navigationAnimations.bottomNavSlide}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {/* Background blur effect */}
          <div className="absolute inset-0 backdrop-blur-lg bg-white/80" />
          
          {/* Navigation content */}
          <div className="flex relative justify-around items-center px-2 py-1">
            {routes.map((route, index) => {
              const isActive = isRouteActive(route.href)
              const IconComponent = isActive ? route.activeIcon : route.icon
              
              return (
                <motion.div
                  key={route.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }}
                  className="flex-1"
                >
                  <NavigationItem
                    href={route.href}
                    icon={<IconComponent className="w-6 h-6" />}
                    label={route.label}
                    isActive={isActive}
                    badge={route.badge}
                    variant="bottom"
                  />
                </motion.div>
              )
            })}
          </div>

          {/* Floating Action Button */}
          <AnimatePresence>
            {showFab && (
              <motion.button
                className="flex absolute right-4 -top-6 justify-center items-center w-12 h-12 text-white bg-blue-600 rounded-full shadow-lg transition-colors duration-200 hover:bg-blue-700 active:scale-95"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFabClick}
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Active route indicator line */}
          <motion.div
            className="absolute top-0 left-0 h-0.5 bg-blue-600"
            layoutId="bottomNavIndicator"
            style={{
              width: `${100 / routes.length}%`,
              left: `${(routes.findIndex(route => isRouteActive(route.href)) * 100) / routes.length}%`
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.nav>
      )}
    </AnimatePresence>
  )
}