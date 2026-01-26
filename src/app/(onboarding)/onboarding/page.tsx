import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'
import { User } from '@/payload-types'

export default async function OnboardingPage() {
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user) {
    redirect('/auth/login?redirect=%2Fonboarding')
  }

  if (user.onboarded) {
    redirect('/dashboard')
  }

  // Fetch Academic Levels
  const academicLevelsData = await payload.find({
    collection: 'academicLevels',
    sort: 'name',
    limit: 100,
  })

  // Fetch Subjects
  const subjectsData = await payload.find({
    collection: 'subjects',
    sort: 'name',
    limit: 100,
  })

  return (
    <OnboardingForm
      user={user as User}
      academicLevels={academicLevelsData.docs}
      subjects={subjectsData.docs}
    />
  )
}
