import type { MetadataRoute } from 'next'

const BASE = 'https://tjphotography.in'
const NOW = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/about`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/films`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/gallery`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}