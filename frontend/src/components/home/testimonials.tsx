'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { testimonials as testimonialsData } from '@/data/testimonials'

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonialsData.length)
  }, [])

  useEffect(() => {
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next])

  return (
    <section className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          className="font-serif text-2xl md:text-4xl text-foreground mb-14 md:mb-20 tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          What Our Couples Say
        </motion.h2>

        <div className="relative min-h-[200px] md:min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <span className="text-5xl text-gold/20 font-serif leading-none mb-4">
                {'\u201C'}
              </span>
              <p className="text-foreground/85 text-base md:text-lg font-light leading-relaxed italic max-w-2xl">
                {testimonialsData[current].quote}
              </p>
              <span className="text-5xl text-gold/20 font-serif leading-none mt-2">
                {'\u201D'}
              </span>
              <div className="mt-6">
                <p className="text-gold text-sm tracking-wide">
                  {testimonialsData[current].author}
                </p>
                <p className="text-muted/60 text-xs mt-1 font-light">
                  {testimonialsData[current].weddingDate}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonialsData.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current ? 'w-8 bg-gold' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
