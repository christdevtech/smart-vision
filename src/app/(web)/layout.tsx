import React from 'react'
import '../styles.css'
import { HeaderServerWrapper } from '@/Header/ServerWrapper'
import { Toaster } from 'sonner'

export const metadata = {
  description:
    'SmartVision - A comprehensive mobile learning platform for secondary education students with personalized study programs, interactive testing, and offline content access.',
  title: 'SmartVision - Mobile Learning Platform',
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-black">
          <HeaderServerWrapper />
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  )
}
