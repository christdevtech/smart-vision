import React from 'react'
import '../styles.css'
import { HeaderServerWrapper } from '@/Header/ServerWrapper'
import Footer from '@/Footer/Component'
import { PublicMotionObserver } from '@/components/PublicSite/PublicMotionObserver'
import './public-site.css'

const publicSiteURL = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://smartvisioncm.com')

export const metadata = {
  description:
    'SmartVision helps secondary students learn with video lessons, digital resources, exam practice, study planning, and progress insights.',
  metadataBase: publicSiteURL,
  openGraph: {
    description:
      'Video lessons, digital resources, exam practice, study planning, and progress insights for secondary students.',
    images: [{ alt: 'SmartVision learning platform', url: '/og.png' }],
    siteName: 'SmartVision',
    title: 'SmartVision | Learn with direction. Practise with confidence.',
    type: 'website',
  },
  title: {
    default: 'SmartVision | Learn, practise, and progress',
    template: '%s | SmartVision',
  },
  twitter: {
    card: 'summary_large_image',
    description:
      'Video lessons, digital resources, exam practice, study planning, and progress insights for secondary students.',
    images: ['/og.png'],
    title: 'SmartVision | Learn with direction. Practise with confidence.',
  },
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <HeaderServerWrapper />
      <main>{children}</main>
      <Footer />
      <PublicMotionObserver />
    </div>
  )
}
