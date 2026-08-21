'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { hero } from '@/data/homepage'

const { slides, interval } = hero

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [next, isPaused])

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === current ? 'animate-kenburns' : ''}`}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      <button onClick={prev} className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full border border-white/15 text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 text-lg backdrop-blur-sm" aria-label="Previous slide">
        {'\u2190'}
      </button>

      <button onClick={next} className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full border border-white/15 text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 text-lg backdrop-blur-sm" aria-label="Next slide">
        {'\u2192'}
      </button>

      <div className="absolute bottom-10 right-8 z-10">
        <span className="font-[var(--font-poppins)] text-[11px] text-white/40 tracking-[0.15em]">
          {String(current + 1).padStart(2, '0')}<span className="text-white/15 mx-1">/</span>{String(slides.length).padStart(2, '0')}
        </span>
      </div>
    </section>
  )
}
