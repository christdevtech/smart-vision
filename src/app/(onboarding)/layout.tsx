import React from 'react'
import '../styles.css'
import { Logo } from '@/components/Graphics/Logo/Logo'

export const metadata = {
  description: 'Complete your profile to get the most out of SmartVision.',
  title: 'Onboarding - SmartVision',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 py-4 border-b border-border">
        <div className="container mx-auto">
          <Logo />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
