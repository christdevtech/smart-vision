import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://smartvisioncm.com').replace(
    /\/$/,
    '',
  )

  return {
    rules: [
      {
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/onboarding/'],
        userAgent: '*',
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  }
}
