export type RateLimitedAuthOperation =
  | 'create'
  | 'forgotPassword'
  | 'login'
  | 'resendVerification'
  | 'resetPassword'

type AttemptWindow = { timestamps: number[] }

const attemptWindows = new Map<string, AttemptWindow>()

const LIMITS: Record<RateLimitedAuthOperation, { attempts: number; windowMs: number }> = {
  create: { attempts: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { attempts: 5, windowMs: 60 * 60 * 1000 },
  login: { attempts: 10, windowMs: 15 * 60 * 1000 },
  resendVerification: { attempts: 5, windowMs: 60 * 60 * 1000 },
  resetPassword: { attempts: 10, windowMs: 60 * 60 * 1000 },
}

export function getRequestClientIP(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  const candidate = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim()
  return candidate || null
}

export function consumeAuthRateLimit({
  headers,
  now = Date.now(),
  operation,
}: {
  headers: Headers
  now?: number
  operation: RateLimitedAuthOperation
}): { allowed: boolean; retryAfterSeconds: number } {
  const clientIP = getRequestClientIP(headers)

  // Local API calls do not reliably carry a client IP. Payload already applies account lockout,
  // so avoid grouping all trusted server-side calls into one global "unknown" bucket.
  if (!clientIP) return { allowed: true, retryAfterSeconds: 0 }

  const { attempts, windowMs } = LIMITS[operation]
  const key = `${operation}:${clientIP}`
  const cutoff = now - windowMs
  const recent = (attemptWindows.get(key)?.timestamps ?? []).filter((value) => value > cutoff)

  if (recent.length >= attempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
    }
  }

  recent.push(now)
  attemptWindows.set(key, { timestamps: recent })

  // Keep the in-memory safety net bounded on long-lived instances.
  if (attemptWindows.size > 10_000) {
    for (const [candidateKey, window] of attemptWindows) {
      if (window.timestamps.every((value) => value <= now - 60 * 60 * 1000)) {
        attemptWindows.delete(candidateKey)
      }
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function resetAuthRateLimitsForTests(): void {
  attemptWindows.clear()
}
