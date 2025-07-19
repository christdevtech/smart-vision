'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      // No token provided, redirect to forgot password
      router.push('/auth/forgot-password')
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
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
            <h1 className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              SmartVision
            </h1>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-emerald-400 text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-white mb-3">Password Reset Successful</h2>
            <p className="text-white/70 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-gradient-to-br from-indigo-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
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
          <h1 className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            SmartVision
          </h1>
          <p className="text-white/60 mt-2">Reset your password</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="text-center mb-6">
              <p className="text-white/70 text-sm">
                Enter your new password below.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-white/60 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-white/60 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}