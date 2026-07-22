'use client'

import { useCallback, useEffect, useState } from 'react'
import { Laptop, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountSession } from '@/services/accountSessions'

export function AccountSessionsPanel({ csrfToken }: { csrfToken: string }) {
  const [sessions, setSessions] = useState<AccountSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/custom/account/sessions', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load active sessions')
      setSessions(data.sessions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load active sessions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const revoke = async (body: { allOthers: true } | { sessionId: string }, action: string) => {
    setPendingAction(action)
    try {
      const response = await fetch('/api/custom/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not revoke the session')
      toast.success(
        data.revoked === 1 ? 'Session signed out' : `${data.revoked} sessions signed out`,
      )
      await loadSessions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke the session')
    } finally {
      setPendingAction(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions...
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">Active sessions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessions expire after 30 days. Remove access you no longer recognize.
          </p>
        </div>
        <button
          type="button"
          disabled={pendingAction !== null || sessions.every((session) => session.current)}
          onClick={() => void revoke({ allOthers: true }, 'all')}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          Sign out others
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Laptop className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {session.current ? 'This device' : 'Signed-in session'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started{' '}
                  {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'recently'}
                  {' · '}Expires {new Date(session.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {!session.current && (
              <button
                type="button"
                aria-label="Sign out this session"
                disabled={pendingAction !== null}
                onClick={() => void revoke({ sessionId: session.id }, session.id)}
                className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {pendingAction === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
