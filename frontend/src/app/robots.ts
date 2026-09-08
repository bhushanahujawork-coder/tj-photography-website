import type { MetadataRoute } from 'next'

const BASE = 'https://tjphotography.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/films', '/gallery', '/s'],
      disallow: [
        '/admin',
        '/api',
        '/login',
        '/dashboard',
        '/weddings',
        '/albums',
        '/folders',
        '/photos',
        '/participants',
        '/downloads',
        '/notifications',
        '/storage',
        '/upload',
        '/settings',
        '/profile',
        '/permissions',
        '/analytics',
        '/activity',
        '/favorites',
        '/errors',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}