'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Graphics/Logo/Logo'

type VerificationState = 'idle' | 'verifying' | 'verified' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const initialEmail = searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)
  const [state, setState] = useState<VerificationState>(token ? 'verifying' : 'idle')
  const [message, setMessage] = useState(
    token ? 'Verifying your email address...' : 'Check your inbox for your verification link.',
  )
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (!token) return

    let active = true
    void fetch(`/api/users/verify/${encodeURIComponent(token)}`, { method: 'POST' })
      .then(async (response) => {
        if (!active) return
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.message || 'This verification link is invalid or has expired.')
        }
        setState('verified')
        setMessage('Your email is verified. You can now sign in.')
      })
      .catch((error: Error) => {
        if (!active) return
        setState('error')
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token])

  const resend = async () => {
    setIsResending(true)
    try {
      const response = await fetch('/api/custom/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not resend the verification email.')
      setMessage(data.message)
      setState('idle')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not resend the email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Verify your email</h1>
          <p className={state === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
            {message}
          </p>

          {state !== 'verified' && state !== 'verifying' && (
            <div className="space-y-3 text-left">
              <label htmlFor="verification-email" className="text-sm text-muted-foreground">
                Email address
              </label>
              <input
                id="verification-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-border bg-input px-4 py-3"
              />
              <button
                type="button"
                disabled={isResending || !email}
                onClick={resend}
                className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          <Link
            href="/auth/login"
            className="inline-block text-sm text-primary hover:text-primary/80"
          >
            Continue to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
