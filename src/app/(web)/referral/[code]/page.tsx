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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Processing referral...</p>
      </div>
    </div>
  )
}