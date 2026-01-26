'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function submitOnboarding(
  userId: string | number,
  data: {
    phoneNumber?: string
    dateOfBirth?: string
    academicLevel?: string
    subjects?: string[]
    profilePic?: string // ID of the uploaded media
  },
) {
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  try {
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        academicLevel: data.academicLevel ? (data.academicLevel as any) : undefined,
        subjects: data.subjects ? (data.subjects as any) : undefined,
        profilePic: data.profilePic ? (data.profilePic as any) : undefined,
        onboarded: true,
      },
    })

    revalidatePath('/dashboard')
  } catch (error) {
    console.error('Onboarding error:', error)
    throw new Error('Failed to save onboarding data')
  }

  redirect('/dashboard')
}
