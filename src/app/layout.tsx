import React from 'react'
import './styles.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'SmartVision - Mobile Learning Platform',
  description:
    'A comprehensive mobile learning platform for secondary education students with personalized study programs, interactive testing, and offline content access.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
