'use client'

import { useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/home/navbar'
import { Lightbox } from '@/components/ui/lightbox'
import { portfolio } from '@/data/portfolio'
import { HomeConfigProvider } from '@/lib/home-config/client'

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
        <div className="columns-2 md:columns-3 xl:columns-4 gap-[2px] pt-20 md:pt-24 -mt-px">
          {portfolio.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openImage(image.id)}
              aria-label={`Open ${image.alt}`}
              className="group relative mb-[2px] block w-full cursor-pointer break-inside-avoid overflow-hidden bg-transparent p-0 text-left"
            >
              <Image
                src={image.gridSrc ?? image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                unoptimized
                draggable={false}
                className="block h-auto w-full transition-[filter] duration-300 group-hover:brightness-[0.97]"
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
          ))}
        </div>
      </main>

      <Lightbox
        open={lightboxIndex !== null}
        images={portfolio}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </HomeConfigProvider>
  )
}
