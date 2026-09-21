import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wedding Gallery — TJ Photography',
  description:
    'Selected wedding stories by TJ Photography, Jamnagar — cinematic frames, fine art moments and full wedding galleries.',
  openGraph: {
    title: 'Wedding Gallery | TJ Photography',
    description:
      'Selected wedding stories by TJ Photography, Jamnagar — cinematic frames and full wedding galleries.',
  },
  alternates: {
    canonical: '/quickportfolio',
  },
}

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}