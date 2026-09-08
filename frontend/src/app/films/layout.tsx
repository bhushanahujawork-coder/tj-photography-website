import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wedding Films',
  description:
    'Cinematic wedding films by TJ Photography, Jamnagar. Films of real Gujarati weddings — full of emotion, story and timeless moments.',
  openGraph: {
    title: 'Wedding Films | TJ Photography',
    description:
      'Cinematic wedding films — real stories captured beautifully. TJ Photography, Jamnagar.',
    url: '/films',
    images: ['/cinema/poster.jpg'],
  },
  alternates: {
    canonical: '/films',
  },
}

export default function FilmsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}