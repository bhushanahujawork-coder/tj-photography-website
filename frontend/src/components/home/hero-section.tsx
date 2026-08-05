'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { hero } from '@/data/homepage'

const { slides, interval } = hero

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [progress, setProgress] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const onScroll = () => {
      const offset = window.scrollY * 0.35
      setScrollOffset(Math.min(offset, 200))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile])

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
  }, [next, interval, isPaused])

  useEffect(() => {
    if (isPaused) return
    setProgress(0)
    const start = Date.now()
    let raf: number
    const tick = () => {
      const p = Math.min((Date.now() - start) / interval, 1)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [current, isPaused, interval])

  return (
    <section
      ref={sectionRef}
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
          <img
            src={slide.src}
            alt={slide.alt}
            className={`w-full h-full object-cover ${i === current ? 'animate-kenburns' : ''}`}
            draggable={false}
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

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-[2px] rounded-full transition-all duration-500 ${
              i === current ? 'w-10 bg-gold' : 'w-4 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-40 h-[2px] bg-white/10 overflow-hidden rounded-full">
        <div
          className="h-full bg-gold transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="absolute bottom-10 right-8 z-10">
        <span className="font-[var(--font-poppins)] text-[11px] text-white/40 tracking-[0.15em]">
          {String(current + 1).padStart(2, '0')}<span className="text-white/15 mx-1">/</span>{String(slides.length).padStart(2, '0')}
        </span>
      </div>
    </section>
  )
}
