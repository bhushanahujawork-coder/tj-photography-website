'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/home/navbar'
import { Lightbox } from '@/components/ui/lightbox'
import { portfolio } from '@/data/portfolio'
import { HomeConfigProvider } from '@/lib/home-config/client'
import { cn } from '@/lib/utils'

function QuickPortfolioHeader() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'sticky top-20 md:top-24 z-40 w-full bg-[#0a0a0a] border-b border-gold/15 overflow-hidden transition-all duration-500 ease-out',
        compact ? 'py-2' : 'py-7 md:py-9',
      )}
    >
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p
          className={cn(
            'uppercase font-medium text-gold transition-all duration-500',
            compact ? 'text-[9px] tracking-[0.3em]' : 'text-[11px] md:text-xs tracking-[0.3em]',
          )}
        >
          TJ Photography
        </p>
        <h1
          className={cn(
            'font-serif text-white tracking-wide leading-tight transition-all duration-500',
            compact ? 'mt-0.5 text-lg md:text-xl' : 'mt-2 text-3xl md:text-5xl',
          )}
        >
          Quick Portfolio
        </h1>
        <div
          className={cn(
            'grid transition-all duration-500 ease-out',
            compact ? 'grid-rows-[0fr] opacity-0 mt-0' : 'grid-rows-[1fr] opacity-100 mt-3',
          )}
        >
          <div className="overflow-hidden">
            <p className="text-white/50 text-xs md:text-sm font-light tracking-wide">
              Real weddings, real emotions — a glimpse of our finest frames
            </p>
            <div className="mt-3 w-14 h-px bg-gold mx-auto" />
          </div>
        </div>
      </div>
    </div>
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
        <div className="pt-20 md:pt-24">
          <QuickPortfolioHeader />
        </div>
        <div className="columns-2 md:columns-3 xl:columns-4 gap-[2px] pt-[2px] -mt-px">
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
