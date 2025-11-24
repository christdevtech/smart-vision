'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Graphics/Logo/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage('Password reset instructions have been sent to your email address.')
        setEmail('')
      } else {
        setError(data.message || 'Failed to send password reset email. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('An error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center px-6 min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
          <p className="mt-2 text-muted-foreground">Reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="p-6 rounded-xl border bg-card border-border">
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  Forgot your password?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we will send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm rounded-lg border bg-destructive/10 border-destructive/20 text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-foreground/80"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-br from-primary to-success text-primary-foreground py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-success/20">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Check your email</h3>
              <p className="mb-6 text-sm text-muted-foreground">{message}</p>
              <button
                onClick={() => {
                  setIsSuccess(false)
                  setMessage('')
                }}
                className="text-sm transition-colors text-primary hover:text-primary/80"
              >
                Send another email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm transition-colors text-primary hover:text-primary/80"
            >
              ← Back to login
            </Link>
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
