import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TJ Photography | Premium Wedding Galleries',
    short_name: 'TJ Photography',
    description:
      'Cinematic wedding films, fine art albums aur premium AI-enabled wedding galleries by TJ Photography, Jamnagar.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#161616',
    theme_color: '#161616',
    lang: 'en',
    categories: ['photography', 'lifestyle', 'events'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Find Your Wedding',
        url: '/#wedding',
        description: 'Access your wedding gallery with your code',
      },
      {
        name: 'Browse Portfolio',
        url: '/#portfolio',
        description: 'Explore recent wedding stories',
      },
    ],
  }
}