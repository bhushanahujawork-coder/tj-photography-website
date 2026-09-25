'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export const easeLux = [0.22, 1, 0.36, 1] as const

export function Eyebrow({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span
      className={`text-[11px] md:text-xs tracking-[0.3em] uppercase font-medium ${
        dark ? 'text-gold' : 'text-gold-dark'
      }`}
    >
      {label}
    </span>
  )
}

export function SplitReveal({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '115%' },
              show: {
                y: '0%',
                transition: { duration: 0.75, ease: easeLux, delay: i * 0.055 },
              },
            }}
          >
            {word}
            {' '}
          </motion.span>
        </motion.span>
      ))}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  heading,
  subtitle,
  dark = false,
  align = 'center',
}: {
  eyebrow: string
  heading: string
  subtitle?: string
  dark?: boolean
  align?: 'center' | 'left'
}) {
  const left = align === 'left'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`flex flex-col mb-7 md:mb-9 ${left ? 'items-start text-left' : 'items-center text-center'}`}
    >
      <Eyebrow label={eyebrow} dark={dark} />
      <h2
        className={`mt-3 font-serif text-3xl md:text-4xl tracking-wide leading-[1.15] ${
          dark ? 'text-white' : 'text-foreground'
        }`}
      >
        <SplitReveal text={heading} />
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm md:text-[15px] font-light leading-relaxed max-w-lg ${
            dark ? 'text-white/50' : 'text-muted'
          }`}
        >
          {subtitle}
        </p>
      )}
      <motion.div
        className={`mt-4 w-14 h-px origin-left ${dark ? 'bg-gold' : 'bg-gold-dark'} ${left ? '' : 'self-center'}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </motion.div>
  )
}

export function Photo({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
}: {
  src: string
  alt: string
  className?: string
  sizes?: string
}) {
  if (!src) return null
  if (src.endsWith('.svg')) {
    return <img src={src} alt={alt} className={className} loading="lazy" />
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
}
