'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from '@/payload-types'
import { Media } from '../Media'
import { User as UserIcon, LogOut, Settings, Loader2 } from 'lucide-react'

interface UserMenuProps {
  user: User
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowLogoutConfirm(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/auth/login')
        router.refresh()
      } else {
        // Fallback to client-side redirect if API fails, though ideally we want the server to clear cookies
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/login')
    } finally {
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex relative justify-center items-center w-8 h-8 bg-gradient-to-br rounded-full transition-transform outline-none hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2 from-primary to-secondary"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.profilePic ? (
          <Media
            resource={user.profilePic}
            alt={user.firstName || 'User'}
            imgClassName="w-full h-full rounded-full object-cover"
            fill
          />
        ) : (
          <span className="text-sm font-semibold text-primary-foreground">
            {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 z-50 mt-2 w-56 rounded-xl border shadow-lg bg-card border-border"
            role="menu"
          >
            <div className="p-3 border-b border-border">
              <p className="font-medium truncate text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs truncate text-muted-foreground">{user.email}</p>
            </div>

            <div className="p-1">
              <Link
                href="/dashboard/account"
                className="flex gap-2 items-center px-3 py-2 text-sm rounded-lg transition-colors outline-none text-foreground hover:bg-accent focus:bg-accent"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/account/settings"
                className="flex gap-2 items-center px-3 py-2 text-sm rounded-lg transition-colors outline-none text-foreground hover:bg-accent focus:bg-accent"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>

            <div className="p-1 border-t border-border">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowLogoutConfirm(true)
                }}
                className="flex gap-2 items-center px-3 py-2 w-full text-sm rounded-lg transition-colors outline-none text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="overflow-hidden w-full max-w-sm rounded-xl border shadow-xl bg-card border-border"
              role="dialog"
              aria-labelledby="logout-title"
              aria-modal="true"
            >
              <div className="p-6">
                <h3 id="logout-title" className="mb-2 text-lg font-semibold text-foreground">
                  Confirm Logout
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Are you sure you want to log out of your account?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-border bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
