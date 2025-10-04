'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful, redirect to login
        router.push('/auth/login?message=Registration successful! Please log in.')
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An error occurred during registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-8">
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
          <p className="text-white/60 mt-2">Create your account</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </div>
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