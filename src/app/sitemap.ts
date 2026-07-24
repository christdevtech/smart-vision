import type { MetadataRoute } from 'next'

const routes = ['', '/features', '/pricing', '/about', '/faq', '/contact', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://smartvisioncm.com').replace(
    /\/$/,
    '',
  )
  const now = new Date()

  return routes.map((route, index) => ({
    changeFrequency: index < 3 ? 'weekly' : 'monthly',
    lastModified: now,
    priority: route === '' ? 1 : index < 3 ? 0.9 : 0.6,
    url: `${origin}${route}`,
  }))
}
