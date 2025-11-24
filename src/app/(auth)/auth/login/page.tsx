'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
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
          <Link href="/" className="inline-block">
            <svg
              width="60"
              height="60"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_4px_8px_rgba(79,70,229,0.3)] mx-auto mb-4"
            >
              <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#6366F1" strokeWidth="2" />
              <path d="M35 40h30v5H35v-5zm0 10h25v5H35v-5zm0 10h20v5H35v-5z" fill="white" />
              <circle cx="75" cy="25" r="8" fill="#10B981" />
              <path d="M72 25l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-success">
            SmartVision
          </h1>
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
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-foreground/80">
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
            <Link href="/auth/forgot-password" className="text-sm transition-colors text-primary hover:text-primary/80">
              Forgot your password?
            </Link>

            <div className="text-sm text-muted-foreground">
              No account yet?{' '}
              <Link href="/auth/register" className="transition-colors text-primary hover:text-primary/80">
                Sign up
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm transition-colors text-muted-foreground hover:text-foreground">
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
