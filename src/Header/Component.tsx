'use client'

import { ArrowRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
          className="public-header__menu-button"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {isOpen ? (
        <div className="public-mobile-nav">
          <nav aria-label="Mobile navigation" className="public-shell">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="public-mobile-nav__actions">
              <ThemeSwitcher />
              {user ? (
                <>
                  {user.role !== 'user' ? (
                    <Link href={adminRoute} onClick={() => setIsOpen(false)}>
                      Admin
                    </Link>
                  ) : null}
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    Open dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    Create an account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
