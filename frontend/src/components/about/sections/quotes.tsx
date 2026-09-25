'use client'

import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AboutConfig, AboutVariant } from '@/lib/home-config/types'
import { Eyebrow, easeLux } from './shared'

type QuotesCfg = AboutConfig['quotes']

function useQuoteRotation(total: number, paused: boolean) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (total === 0 || paused) return
    const t = setInterval(() => setI((v) => v + 1), 5000)
    return () => clearInterval(t)
  }, [total, paused])
  return [i, setI] as const
}

function useSwipe(setI: (fn: (v: number) => number) => void) {
  const touchX = useRef<number | null>(null)
  const handlers = {
    onTouchStart: (e: TouchEvent) => {
      touchX.current = e.touches[0].clientX
    },
    onTouchEnd: (e: TouchEvent) => {
      if (touchX.current === null) return
      const dx = e.changedTouches[0].clientX - touchX.current
      if (dx < -40) setI((v) => v + 1)
      else if (dx > 40) setI((v) => v - 1)
      touchX.current = null
    },
  }
  return handlers
}

/* A — compact auto-only quote band on cream (original design) */
function QuotesA({ quotes }: { quotes: QuotesCfg }) {
  const total = quotes.length
  const [paused, setPaused] = useState(false)
  const [i, setI] = useQuoteRotation(total, paused)
  const swipe = useSwipe(setI)

  if (total === 0) return null
  const active = quotes[((i % total) + total) % total]

  return (
    <section
      className="relative w-full bg-[#eae1d2] py-9 md:py-11 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      {...swipe}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="relative min-h-[104px] md:min-h-[96px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={`${i}-${active.label}`}
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <p className="font-serif text-base md:text-xl text-foreground/90 leading-relaxed tracking-wide max-w-2xl">
                &ldquo;{active.text}&rdquo;
              </p>
              <p className="mt-2 text-gold-dark text-[10px] md:text-[11px] tracking-[0.3em] uppercase">
                {active.label}
              </p>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* B — big centered quote on dark with oversized gold quotation mark */
function QuotesB({ quotes }: { quotes: QuotesCfg }) {
  const total = quotes.length
  const [paused, setPaused] = useState(false)
  const [i, setI] = useQuoteRotation(total, paused)
  const swipe = useSwipe(setI)

  if (total === 0) return null
  const active = quotes[((i % total) + total) % total]

  return (
    <section
      className="relative w-full bg-[#161616] py-14 md:py-20 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      {...swipe}
    >
      <div
        aria-hidden
        className="absolute top-2 left-1/2 -translate-x-1/2 font-serif text-[140px] md:text-[200px] leading-none text-gold/12 select-none pointer-events-none"
      >
        &ldquo;
      </div>
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="relative min-h-[150px] md:min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={`${i}-${active.label}`}
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: easeLux }}
            >
              <p className="font-serif text-xl md:text-3xl text-white/90 leading-[1.5] tracking-wide">
                &ldquo;{active.text}&rdquo;
              </p>
              <div className="w-10 h-px bg-gold mt-5" />
              <p className="mt-3 text-gold text-[10px] md:text-[11px] tracking-[0.3em] uppercase">
                {active.label}
              </p>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* C — side-by-side quote cards (first 3 quotes, static grid) */
function QuotesC({ quotes }: { quotes: QuotesCfg }) {
  if (quotes.length === 0) return null
  const cards = quotes.slice(0, 3)

  return (
    <section className="relative w-full bg-[#eae1d2] py-12 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-9">
          <Eyebrow label="Words We Live By" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {cards.map((q, ci) => (
            <motion.figure
              key={`${q.label}-${ci}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: ci * 0.1 }}
              className="relative bg-white/60 border border-gold/20 rounded-sm px-6 py-8 flex flex-col items-center text-center hover:border-gold/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.12)] transition-all duration-500"
            >
              <span aria-hidden className="font-serif text-5xl leading-none text-gold/40 mb-3">
                &ldquo;
              </span>
              <blockquote className="font-serif text-base md:text-lg text-foreground/90 leading-relaxed tracking-wide flex-1">
                {q.text}
              </blockquote>
              <figcaption className="mt-4 text-gold-dark text-[10px] tracking-[0.3em] uppercase">
                {q.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Quotes({ cfg, variant }: { cfg: QuotesCfg; variant: AboutVariant }) {
  if (variant === 1) return <QuotesB quotes={cfg} />
  if (variant === 2) return <QuotesC quotes={cfg} />
  return <QuotesA quotes={cfg} />
}
