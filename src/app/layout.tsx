import React from 'react'
// import './styles.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata = {
  title: 'SmartVision | Learn, practise, and progress',
  description:
    'Learning resources, exam practice, study planning, and progress insights for secondary students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
