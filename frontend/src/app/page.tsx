import type { Metadata } from 'next'
import Navbar from '@/components/home/navbar'
import HomeSections from '@/components/home/home-sections'
import Footer from '@/components/home/footer'
import WhatsappFloat from '@/components/home/whatsapp-float'
import ScrollProgress from '@/components/home/scroll-progress'
import { HomeConfigProvider } from '@/lib/home-config/client'

export const metadata: Metadata = {
  title: 'Best Wedding Photographer in Jamnagar',
  description:
    'TJ Photography is a premium wedding photography studio in Jamnagar, Gujarat. Cinematic wedding films, fine art albums and private online galleries for couples across Gujarat.',
  openGraph: {
    title: 'Best Wedding Photographer in Jamnagar | TJ Photography',
    description:
      'Cinematic films, fine art albums aur private online galleries — TJ Photography, Jamnagar.',
    url: '/',
    images: ['/hero/hero-1.webp'],
  },
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'TJ Photography',
    description:
      'Premium wedding photography studio in Jamnagar, Gujarat. Cinematic wedding films, fine art albums and private online galleries.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jamnagar',
      addressRegion: 'Gujarat',
      addressCountry: 'IN',
    },
    areaServed: 'Gujarat, India',
  }

  return (
    <HomeConfigProvider>
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
        <ScrollProgress />
        <Navbar />
        <main>
          <HomeSections />
        </main>
        <Footer />
        <WhatsappFloat />
      </>
    </HomeConfigProvider>
  )
}