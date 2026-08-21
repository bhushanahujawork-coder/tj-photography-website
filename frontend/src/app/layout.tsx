import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://tjphotography.in'),
  title: {
    default: 'TJ Photography | Best Wedding Photographer in Jamnagar',
    template: '%s | TJ Photography',
  },
  description:
    'TJ Photography — Jamnagar ka finest wedding photographer. Cinematic films, fine art albums, premium wedding galleries with AI face search. Book your wedding shoot today.',
  keywords: [
    'wedding photography',
    'wedding photographer in Jamnagar',
    'cinematic wedding film',
    'fine art wedding',
    'premium wedding photographer',
    'wedding gallery',
    'TJ Photography',
  ],
  authors: [{ name: 'TJ Photography' }],
  creator: 'TJ Photography',
  openGraph: {
    title: 'TJ Photography | Best Wedding Photographer in Jamnagar',
    description:
      'Cinematic films, fine art albums aur premium wedding galleries — love ko light mein capture karte hain. Book TJ Photography today.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'TJ Photography',
    url: '/',
    images: [
      {
        url: '/hero/hero-1.webp',
        width: 1200,
        height: 630,
        alt: 'TJ Photography — Premium Wedding Photography',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TJ Photography | Best Wedding Photographer in Jamnagar',
    description:
      'Cinematic films, fine art albums aur premium wedding galleries. Book your wedding shoot today.',
    images: ['/hero/hero-1.webp'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: '#eae1d2',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans antialiased">
        <div className="grain" aria-hidden="true" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'TJ Photography',
              description:
                'Premium wedding photography, cinematic films and fine art albums in Jamnagar, Gujarat.',
              image: '/hero/hero-1.webp',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Jamnagar',
                addressRegion: 'Gujarat',
                addressCountry: 'IN',
              },
              areaServed: [
                'Jamnagar',
                'Rajkot',
                'Ahmedabad',
                'Vadodara',
                'Surat',
              ],
              priceRange: '₹₹',
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}
