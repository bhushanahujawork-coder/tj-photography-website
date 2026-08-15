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
  title: 'TJ Photography | Fine Art Wedding Photography',
  description:
    'Where love meets light. TJ Photography specializes in premium wedding photography, cinematic films, and fine art albums. Browse your wedding gallery with your private code.',
  keywords: [
    'wedding photography',
    'fine art wedding',
    'premium wedding photographer',
    'wedding gallery',
    'TJ Photography',
  ],
  openGraph: {
    title: 'TJ Photography | Fine Art Wedding Photography',
    description:
      'Where love meets light. Premium wedding photography and cinematic storytelling.',
    type: 'website',
    siteName: 'TJ Photography',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
