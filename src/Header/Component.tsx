'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Logo } from '@/components/Graphics/Logo/Logo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import type { User } from '@/payload-types'

interface HeaderProps {
  adminRoute?: string
  user?: User | null
}

const navigation = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
] as const

export function Header({ adminRoute = '/admin', user }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (isOpen) {
      closeButtonRef.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const closeNavigation = () => {
    setIsOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <header className="public-header">
      <div className="public-shell public-header__inner">
        <Logo loading="eager" priority="high" />

        <nav aria-label="Primary navigation" className="public-header__nav">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-header__actions">
          <ThemeSwitcher variant="icon-only" />
          {user ? (
            <>
              {user.role !== 'user' ? (
                <Link className="public-header__text-link" href={adminRoute}>
                  Admin
                </Link>
              ) : null}
              <Link className="public-button public-button--small" href="/dashboard">
                Dashboard <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </>
          ) : (
            <>
              <Link className="public-header__text-link" href="/auth/login">
                Sign in
              </Link>
              <Link className="public-button public-button--small" href="/auth/register">
                Get started <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </>
          )}
        </div>

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          aria-controls="public-mobile-navigation"
          className="public-header__menu-button"
          onClick={() => setIsOpen((open) => !open)}
          ref={menuButtonRef}
          type="button"
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="public-mobile-nav"
            exit={{ opacity: 0 }}
            id="public-mobile-navigation"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              aria-label="Close navigation"
              className="public-mobile-nav__backdrop"
              onClick={closeNavigation}
              type="button"
            />
            <motion.aside
              animate={{ x: 0 }}
              aria-label="Mobile navigation panel"
              className="public-mobile-nav__panel"
              exit={{ x: '100%' }}
              initial={{ x: '100%' }}
              transition={{ damping: 28, stiffness: 280, type: 'spring' }}
            >
              <div className="public-mobile-nav__header">
                <div>
                  <span>SmartVision</span>
                  <small>Explore the platform</small>
                </div>
                <button
                  aria-label="Close navigation"
                  className="public-mobile-nav__close"
                  onClick={closeNavigation}
                  ref={closeButtonRef}
                  type="button"
                >
                  <X aria-hidden="true" size={21} />
                </button>
              </div>

              <nav aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
                    <span>{item.label}</span>
                    <ArrowRight aria-hidden="true" size={17} />
                  </Link>
                ))}
              </nav>

              <div className="public-mobile-nav__utility">
                <span>Appearance</span>
                <ThemeSwitcher variant="icon-only" />
              </div>

              <div className="public-mobile-nav__actions">
                {user ? (
                  <>
                    {user.role !== 'user' ? (
                      <Link
                        className="public-button public-button--secondary"
                        href={adminRoute}
                        onClick={() => setIsOpen(false)}
                      >
                        Admin
                      </Link>
                    ) : null}
                    <Link
                      className="public-button"
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                    >
                      Open dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="public-button public-button--secondary"
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      className="public-button"
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
