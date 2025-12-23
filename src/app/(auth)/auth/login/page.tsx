'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Graphics/Logo/Logo'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const messageType = searchParams.get('type') || 'success'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center px-6 min-h-screen text-foreground bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="p-6 rounded-xl border bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={
                  messageType === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm'
                    : 'bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm'
                }
              >
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-red-400 rounded-lg border bg-red-500/10 border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-foreground/80">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2 w-full rounded-lg border text-foreground bg-input border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-foreground/80"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 w-full rounded-lg border text-foreground bg-input border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-primary to-success text-primary-foreground py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm transition-colors text-primary hover:text-primary/80"
            >
              Forgot your password?
            </Link>

            <div className="text-sm text-muted-foreground">
              No account yet?{' '}
              <Link
                href="/auth/register"
                className="transition-colors text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
