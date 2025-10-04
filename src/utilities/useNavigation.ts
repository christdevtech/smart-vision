'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface UseNavigationReturn {
  isMenuOpen: boolean
  isMobile: boolean
  activeRoute: string
  breadcrumbs: BreadcrumbItem[]
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  setActiveRoute: (route: string) => void
}

interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

export function useNavigation(): UseNavigationReturn {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeRoute, setActiveRoute] = useState('')
  const pathname = usePathname()

  // Check if device is mobile
  const checkIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Add home/dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      isActive: path === '/dashboard'
    })

    // Add path segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      if (segment === 'dashboard') return // Skip dashboard as it's already added

      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      breadcrumbs.push({
        label: formatSegmentLabel(segment),
        href: isLast ? undefined : currentPath,
        isActive: isLast
      })
    })

    return breadcrumbs
  }, [])

  // Format segment label for display
  const formatSegmentLabel = (segment: string): string => {
    // Handle special cases
    const specialCases: Record<string, string> = {
      'analytics': 'Analytics',
      'notifications': 'Notifications',
      'profile': 'Profile',
      'settings': 'Settings',
      'content': 'Content',
      'media': 'Media Library',
      'pages': 'Pages',
      'products': 'Products',
      'orders': 'Orders',
      'users': 'Users',
    }

    if (specialCases[segment]) {
      return specialCases[segment]
    }

    // Default formatting: capitalize first letter and replace hyphens/underscores
    return segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  // Menu control functions
  const openMenu = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  // Update active route when pathname changes
  useEffect(() => {
    setActiveRoute(pathname)
    // Close mobile menu when route changes
    if (isMobile) {
      setIsMenuOpen(false)
    }
  }, [pathname, isMobile])

  // Handle window resize
  useEffect(() => {
    checkIsMobile()
    
    const handleResize = () => {
      checkIsMobile()
      // Close menu when switching to desktop
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [checkIsMobile])

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen, closeMenu])

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (isMobile && isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isMenuOpen])

  return {
    isMenuOpen,
    isMobile,
    activeRoute,
    breadcrumbs,
    openMenu,
    closeMenu,
    toggleMenu,
    setActiveRoute,
  }
}