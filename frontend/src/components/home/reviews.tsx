'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useHomeConfig } from '@/lib/home-config/client'

function useVisibleCount() {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const xl = window.matchMedia('(min-width: 80rem)')
    const lg = window.matchMedia('(min-width: 64rem)')
    const sm = window.matchMedia('(min-width: 40rem)')
    const update = () => {
      if (xl.matches) setCount(4)
      else if (lg.matches) setCount(3)
      else if (sm.matches) setCount(2)
      else setCount(1)
    }
    update()
    xl.addEventListener('change', update)
    lg.addEventListener('change', update)
    sm.addEventListener('change', update)
    return () => {
      xl.removeEventListener('change', update)
      lg.removeEventListener('change', update)
      sm.removeEventListener('change', update)
    }
  }, [])
  return count
}

function initials(name: string) {
  return name
    .split(' ')
    .filter((p) => /[A-Z]/.test(p[0] ?? ''))
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

export default function Reviews() {
  const { config } = useHomeConfig()
  const reviews = config.reviews.reviews
  const heading = config.reviews
  const visible = useVisibleCount()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const maxIndex = reviews.length - visible

  useEffect(() => {
    if (paused) return
    const t = setInterval(
      () => setIndex((i) => (i >= maxIndex ? 0 : i + 1)),
      4000
    )
    return () => clearInterval(t)
  }, [paused, maxIndex])

  const safeIndex = Math.min(index, Math.max(0, maxIndex))

  const goPrev = () =>
    setIndex((i) => (i <= 0 ? Math.max(0, maxIndex) : i - 1))
  const goNext = () =>
    setIndex((i) => (i >= maxIndex ? 0 : i + 1))

  const touchX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
    setPaused(true)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    setPaused(false)
    if (Math.abs(dx) < 40) return
    if (dx < 0) goNext()
    else goPrev()
  }

  if (reviews.length === 0) return null

  return (
    <section className="relative w-full bg-[#eae1d2] py-14 md:py-24 2xl:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 2xl:max-w-[1400px] 3xl:max-w-[1700px]">
        <div className="grid gap-10 lg:grid-cols-10 lg:gap-14 items-center">
          <div className="lg:col-span-3">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -top-14 -left-6 font-serif text-[8rem] sm:-top-20 sm:-left-10 sm:text-[13rem] md:text-[18rem] leading-none text-gold/15 select-none"
              >
                &ldquo;
              </span>
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <span className="text-[#B8941E] text-xs tracking-[0.3em] uppercase font-medium">
                  {heading.eyebrow}
                </span>
                <h2 className="mt-3 font-[var(--font-poppins)] font-semibold text-4xl md:text-5xl xl:text-6xl 2xl:text-[4.25rem] text-[#161616] leading-[1.05] tracking-wide">
                  {heading.titleLine1}
                  <br />
                  {heading.titleLine2}
                </h2>
                <div className="mt-5 w-16 h-px bg-[#B8941E]" />
                <p className="mt-5 text-[#3d3d3d] text-sm 2xl:text-base font-light leading-relaxed max-w-xs">
                  {heading.description}
                </p>
                <div className="mt-6 flex items-center gap-2.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        className="w-4 h-4 text-[#D4AF37]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[#8a857e] text-xs tracking-wide">
                    {heading.rating}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div
              className="relative touch-pan-y"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <button
                onClick={goPrev}
                aria-label="Previous reviews"
                className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 border border-[#B8941E]/40 text-[#161616] shadow-md hover:bg-[#B8941E] hover:text-white transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goNext}
                aria-label="Next reviews"
                className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 border border-[#B8941E]/40 text-[#161616] shadow-md hover:bg-[#B8941E] hover:text-white transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  animate={{ x: `${-safeIndex * (100 / visible)}%` }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  {reviews.map((r) => (
                    <div
                      key={r.name}
                      className="w-full shrink-0 px-2 sm:px-2.5 sm:w-1/2 lg:w-1/3 xl:w-1/4"
                    >
                      <div className="relative bg-white rounded-2xl border border-black/5 shadow-md p-6 md:p-7 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gold/30">
                        <span
                          aria-hidden
                          className="absolute top-4 right-6 font-serif text-6xl leading-none text-gold/15 select-none"
                        >
                          &rdquo;
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <svg
                              key={s}
                              className="w-4 h-4 text-[#D4AF37]"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                        <p className="mt-4 text-sm md:text-[15px] text-[#3d3d3d] leading-relaxed flex-1">
                          &ldquo;{r.quote}&rdquo;
                        </p>
                        <div className="mt-5 pt-4 border-t border-black/5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#161616] to-black text-gold ring-2 ring-gold/25 flex items-center justify-center text-xs font-semibold tracking-wide shrink-0">
                            {initials(r.name)}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[#161616] text-sm font-semibold truncate">
                              {r.name}
                            </span>
                            <span className="text-[#8a857e] text-[11px] tracking-[0.15em] uppercase truncate">
                              {r.city}, {r.state}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {maxIndex > 10 ? null : (
                <div className="mt-5 flex flex-wrap justify-center gap-0.5 px-4">
                  {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="flex items-center justify-center p-2.5"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all duration-300 ${
                          i === safeIndex
                            ? 'w-7 bg-[#B8941E]'
                            : 'w-1.5 bg-black/15'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-4 sm:hidden">
                <button
                  onClick={goPrev}
                  aria-label="Previous reviews"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/90 border border-[#B8941E]/40 text-[#161616] shadow-md active:bg-[#B8941E] active:text-white transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next reviews"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/90 border border-[#B8941E]/40 text-[#161616] shadow-md active:bg-[#B8941E] active:text-white transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}