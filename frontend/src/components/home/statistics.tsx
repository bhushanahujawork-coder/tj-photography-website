'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { statistics } from '@/data/statistics'
import { statisticsHeading } from '@/data/homepage'

function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  label,
  delay = 0,
}: {
  value: number
  suffix?: string
  prefix?: string
  label: string
  delay?: number
}) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const done = count >= value

  useEffect(() => {
    if (!isInView) return
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [isInView, delay])

  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    const duration = 1100

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [started, value])

  return (
    <div ref={ref} className="text-center relative">
      {done && (
        <motion.span
          className="absolute left-1/2 top-4 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-gold/40 pointer-events-none"
          initial={{ scale: 0.3, opacity: 0.6 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      )}
      {done && (
        <motion.span
          className="absolute left-1/2 top-4 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gold/10 blur-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      )}
      <motion.span
        className="relative font-serif text-3xl md:text-5xl tracking-wide bg-gradient-to-r from-[#7a5c10] via-[#d4af37] to-[#7a5c10] bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer inline-block"
        animate={done ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {prefix}
        {count}
        {suffix}
      </motion.span>
      <motion.p
        className="text-muted text-sm mt-2 font-light tracking-wide"
        initial={{ opacity: 0, y: 8 }}
        animate={started ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: delay / 1000 + 1.2, duration: 0.6, ease: 'easeOut' }}
      >
        {label}
      </motion.p>
    </div>
  )
}

export default function Statistics() {
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 180])

  return (
    <section className="relative py-10 md:py-14 bg-gradient-to-b from-background via-[#f5efe5] to-background border-t border-border/60 overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          y: bgY,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,175,55,0.14), transparent 70%), radial-gradient(ellipse 40% 40% at 85% 100%, rgba(212,175,55,0.08), transparent 70%), radial-gradient(rgba(212,175,55,0.09) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 28px 28px',
        }}
      />
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.h2
          className="font-serif text-2xl md:text-4xl text-center text-foreground mb-8 md:mb-10 tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {statisticsHeading.title}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-[#D4AF37]/15">
          {statistics.map((stat, i) => (
            <div key={stat.label} className="md:px-4">
              <AnimatedCounter {...stat} delay={i * 200} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
