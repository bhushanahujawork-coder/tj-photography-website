import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About the Studio',
  description:
    'TJ Photography wedding studio in Jamnagar, Gujarat. The team, the studio and the craft behind cinematic wedding films and fine art albums.',
  openGraph: {
    title: 'About the Studio | TJ Photography',
    description:
      'The wedding studio in Jamnagar, Gujarat — cinematic films, fine art albums aur premium online galleries.',
    url: '/about',
    images: ['/studio/studio-1.svg'],
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}