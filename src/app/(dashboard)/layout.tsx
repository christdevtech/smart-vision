import React from 'react'
import '../styles.css'
import { Toaster } from 'sonner'

export const metadata = {
  description:
    'SmartVision Dashboard - Access your personalized learning content, track progress, and manage your account.',
  title: 'Dashboard - SmartVision',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-black">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  )
}