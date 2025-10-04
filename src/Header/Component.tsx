'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@/payload-types'

interface HeaderProps {
  user?: User | null
  adminRoute?: string
}

export function Header({ user, adminRoute = '/admin' }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-toggle')) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const closeMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm border-white/10 bg-black/50">
        <div className="flex justify-between items-center px-4 py-3 mx-auto max-w-6xl">
          {/* Logo */}
          <Link href="/" className="flex gap-2 items-center no-underline" onClick={closeMenu}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_4px_8px_rgba(79,70,229,0.3)] sm:w-10 sm:h-10"
            >
              <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
              <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
              <circle cx="75" cy="25" r="8" fill="#10B981" />
              <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-emerald-500 sm:text-xl">
              SmartVision
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3 items-center">
            {user && (
              <span className="text-sm text-white/80 max-w-32 truncate">
                Welcome, {user.firstName || user.email}
              </span>
            )}
            {user ? (
              <>
                {user.role !== 'user' && (
                  <Link
                    href={adminRoute}
                    className="px-3 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                    rel="noopener noreferrer"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                >
                  Dashboard
                </Link>
                <Link
                  href="/auth/logout"
                  className="px-3 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-red-600/20 border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50"
                >
                  Logout
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-2 text-sm font-medium text-white no-underline rounded-lg border transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="menu-toggle md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" />
      )}

      {/* Mobile Menu */}
      <div
        className={`mobile-menu fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-gray-900/95 backdrop-blur-md border-r border-white/10 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <div className="flex gap-2 items-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_4px_8px_rgba(79,70,229,0.3)]"
              >
                <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
                <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
                <circle cx="75" cy="25" r="8" fill="#10B981" />
                <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
              </svg>
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-emerald-500">
                SmartVision
              </span>
            </div>
            <button
              onClick={closeMenu}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {user.firstName || 'User'}
                  </p>
                  <p className="text-white/60 text-xs truncate max-w-48">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 text-white no-underline rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>

                  {user.role !== 'user' && (
                    <Link
                      href={adminRoute}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 text-white no-underline rounded-lg hover:bg-white/10 transition-colors"
                      rel="noopener noreferrer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <Link
                    href="/auth/logout"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 text-red-400 no-underline rounded-lg hover:bg-red-600/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={closeMenu}
                  className="flex items-center gap-3 p-3 text-white no-underline rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
