import React from 'react'
import '../styles.css'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export const metadata = {
  description: 'Sign in or create your SmartVision student account.',
  title: 'Account | SmartVision',
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher variant="icon-only" className="mr-2" />
      </div>
      {children}
    </div>
  )
}
