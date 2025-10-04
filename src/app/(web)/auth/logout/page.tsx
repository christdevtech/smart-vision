'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the Payload CMS logout API
        const response = await fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Logout successful, refresh the page to clear any cached data
          window.location.href = '/'
        } else {
          console.error('Logout failed')
          // Still redirect to home even if logout API fails
          router.push('/')
        }
      } catch (error) {
        console.error('Error during logout:', error)
        // Still redirect to home even if there's an error
        router.push('/')
      }
    }

    handleLogout()
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Logging out...</p>
      </div>
    </div>
  )
}