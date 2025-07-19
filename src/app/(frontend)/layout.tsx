import React from 'react'
import './styles.css'
import { Header } from '@/Header/Component'

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
          <Header />
          {children}
        </main>
      </body>
    </html>
  )
}
