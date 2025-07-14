import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'

interface ReferralPageProps {
  params: {
    code: string
  }
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = params
  
  if (!code) {
    redirect('/')
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    
    // Find user with the referral code to validate it exists
    const result = await payload.find({
      collection: 'users',
      where: {
        referralCode: {
          equals: code,
        },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      // Invalid referral code, redirect to home
      redirect('/')
    }

    // Valid referral code, redirect to the API endpoint that sets the cookie
    redirect(`/api/custom/referral/redirect/${code}`)
  } catch (error) {
    console.error('Error processing referral:', error)
    // On error, redirect to home
    redirect('/')
  }
}