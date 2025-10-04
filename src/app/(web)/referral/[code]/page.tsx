'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ReferralPageProps {
  params: Promise<{
    code: string
  }>
}

export default function ReferralPage({ params }: ReferralPageProps) {
  const router = useRouter()

  useEffect(() => {
    async function processReferral() {
      try {
        const { code } = await params

        if (!code) {
          router.push('/')
          return
        }

        // Call the API endpoint to set the cookie
        const response = await fetch(`/api/custom/referral/redirect/${code}`)
        const data = await response.json()

        if (response.ok && data.success) {
          // Cookie was set successfully, redirect to home
          router.push(data.redirectUrl || '/')
        } else {
          // Invalid referral code or error, redirect to home
          router.push('/')
        }
      } catch (error) {
        console.error('Error processing referral:', error)
        // On error, redirect to home
        router.push('/')
      }
    }

    processReferral()
  }, [params, router])

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 animate-spin border-primary"></div>
        <p className="text-muted-foreground">Processing referral...</p>
      </div>
    </div>
  )
}
