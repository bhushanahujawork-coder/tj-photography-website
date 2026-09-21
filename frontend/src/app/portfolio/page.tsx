'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/home/navbar'
import Footer from '@/components/home/footer'
import { Lightbox } from '@/components/ui/lightbox'
import { portfolio } from '@/data/portfolio'
import type { PortfolioImage } from '@/types'
import { HomeConfigProvider } from '@/lib/home-config/client'

function PortfolioThumb({ image, onOpen }: { image: PortfolioImage; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${image.alt}`}
      className="group relative mb-[2px] block w-full cursor-pointer break-inside-avoid overflow-hidden bg-[#dcd1ba] p-0 text-left"
    >
      <Image
        src={image.gridSrc ?? image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`block h-auto w-full transition-[filter,opacity] duration-500 group-hover:brightness-[0.97] ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-white mix-blend-difference drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
    </button>
  )
}

export default function PortfolioGalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openImage = (id: string) => {
    const idx = portfolio.findIndex((image) => image.id === id)
    if (idx >= 0) setLightboxIndex(idx)
  }

  return (
    <HomeConfigProvider>
      <Navbar />
      <main className="bg-[#eae1d2]">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-24 text-center md:pt-28 2xl:max-w-[1400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.22em] text-[#161616]/50 transition-colors duration-300 hover:text-gold"
          >
            <span aria-hidden="true">←</span> Back to Home
          </Link>
          <p className="mt-6 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.3em] text-gold">
            Portfolio
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#161616] md:text-5xl">
            Selected Wedding Stories
          </h1>
          <p className="mt-3 text-sm text-[#161616]/60">
            {portfolio.length} photographs — click any frame to view
          </p>
        </div>

        <div className="columns-2 md:columns-3 xl:columns-4 gap-[2px]">
          {portfolio.map((image) => (
            <PortfolioThumb key={image.id} image={image} onOpen={() => openImage(image.id)} />
          ))}
        </div>
      </main>
      <Footer />

      <Lightbox
        open={lightboxIndex !== null}
        images={portfolio}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </HomeConfigProvider>
  )
}
