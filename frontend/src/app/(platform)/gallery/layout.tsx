import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Your Wedding Gallery',
  description:
    'Access your TJ Photography wedding gallery using your wedding code. View and download your wedding photos — easy access for couples.',
  openGraph: {
    title: 'Find Your Wedding Gallery | TJ Photography',
    description:
      'Apni TJ Photography wedding gallery code se access karo — photos dekho aur download karo.',
    url: '/gallery',
    images: ['/hero/hero-1.webp'],
  },
  alternates: {
    canonical: '/gallery',
  },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}