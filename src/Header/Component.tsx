'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@/payload-types'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Logo } from '@/components/Graphics/Logo/Logo'

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
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm border-border bg-background/80">
        <div className="flex justify-between items-center px-4 py-3 mx-auto max-w-6xl">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden gap-3 items-center md:flex">
            <ThemeSwitcher variant="icon-only" className="mr-2" />
            {user && (
              <span className="text-sm truncate text-foreground/80 max-w-32">
                Welcome, {user.firstName || user.email}
              </span>
            )}
            {user ? (
              <>
                {user.role !== 'user' && (
                  <Link
                    href={adminRoute}
                    className="px-3 py-2 text-sm font-medium no-underline rounded-lg border transition-all duration-300 text-foreground bg-secondary border-border hover:bg-accent"
                    rel="noopener noreferrer"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium no-underline rounded-lg border transition-all duration-300 text-foreground bg-secondary border-border hover:bg-accent"
                >
                  Dashboard
                </Link>
                <Link
                  href="/auth/logout"
                  className="px-3 py-2 text-sm font-medium no-underline rounded-lg border transition-all duration-300 text-destructive-foreground bg-destructive/20 border-destructive/30 hover:bg-destructive/30"
                >
                  Logout
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-2 text-sm font-medium no-underline rounded-lg border transition-all duration-300 text-foreground bg-secondary border-border hover:bg-accent"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex gap-2 items-center md:hidden">
            <ThemeSwitcher variant="icon-only" />
            <button
              className="p-2 rounded-lg transition-colors menu-toggle text-foreground hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 backdrop-blur-sm bg-background/50 md:hidden" />
      )}

      {/* Mobile Menu */}
      <div
        className={`mobile-menu fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur-md border-r border-border transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-border">
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
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-success">
                SmartVision
              </span>
            </div>
            <button
              onClick={closeMenu}
              className="p-2 rounded-lg transition-colors text-foreground hover:bg-accent"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-border">
              <div className="flex gap-3 items-center">
                <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br rounded-full from-primary to-success">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.firstName || 'User'}</p>
                  <p className="text-xs truncate text-muted-foreground max-w-48">{user.email}</p>
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
                    className="flex gap-3 items-center p-3 no-underline rounded-lg transition-colors text-foreground hover:bg-accent"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
                      />
                    </svg>
                    <span>Dashboard</span>
                  </Link>

                  {user.role !== 'user' && (
                    <Link
                      href={adminRoute}
                      onClick={closeMenu}
                      className="flex gap-3 items-center p-3 no-underline rounded-lg transition-colors text-foreground hover:bg-accent"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <Link
                    href="/auth/logout"
                    onClick={closeMenu}
                    className="flex gap-3 items-center p-3 no-underline rounded-lg transition-colors text-destructive hover:bg-destructive/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={closeMenu}
                  className="flex gap-3 items-center p-3 no-underline rounded-lg transition-colors text-foreground hover:bg-accent"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
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
