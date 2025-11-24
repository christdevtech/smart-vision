import React from 'react'
import '../styles.css'
import { HeaderServerWrapper } from '@/Header/ServerWrapper'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export const metadata = {
  description:
    'SmartVision - A comprehensive mobile learning platform for secondary education students with personalized study programs, interactive testing, and offline content access.',
  title: 'SmartVision - Authentication',
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
