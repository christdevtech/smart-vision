import React from 'react'

export const metadata = {
  description:
    'SmartVision Dashboard - Access your personalized learning content, track progress, and manage your account.',
  title: 'Dashboard - SmartVision',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen text-white bg-black">{children}</div>
}
