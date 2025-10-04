import React from 'react'
import './styles.css'
import { HeaderServerWrapper } from '@/Header/ServerWrapper'
import { Toaster } from 'sonner'

export const metadata = {
  description:
    'SmartVision - A comprehensive mobile learning platform for secondary education students with personalized study programs, interactive testing, and offline content access.',
  title: 'SmartVision - Mobile Learning Platform',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>
          <HeaderServerWrapper />
          {children}
        </main>
        <Toaster 
          theme="dark" 
          position="top-center"
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
