'use client'

import { motion } from 'framer-motion'
import type { AboutConfig, AboutVariant } from '@/lib/home-config/types'
import { Eyebrow, SplitReveal } from './shared'

type ApproachCfg = AboutConfig['approach']

/* A — compact centered paragraph + principles row (original design) */
function ApproachA({ cfg }: { cfg: ApproachCfg }) {
  return (
    <section className="relative w-full bg-[#eae1d2] py-10 md:py-12 overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <Eyebrow label={cfg.eyebrow} />
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground tracking-wide leading-[1.15]">
            <SplitReveal text={cfg.heading} />
          </h2>
          <p className="mt-4 text-muted text-sm md:text-[15px] font-light leading-[1.9] max-w-2xl mx-auto">
            {cfg.paragraph}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          {cfg.principles.map((p, prI) => (
            <span key={`${p}-${prI}`} className="flex items-center gap-5">
              {prI > 0 && <span aria-hidden className="w-1 h-1 rounded-full bg-gold-dark/60" />}
              <span className="font-[var(--font-poppins)] text-[11px] md:text-xs tracking-[0.22em] uppercase text-foreground/80">
                {p}
              </span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* B — 2-column numbered principles */
function ApproachB({ cfg }: { cfg: ApproachCfg }) {
  return (
    <section className="relative w-full bg-[#eae1d2] py-12 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center md:text-left md:sticky md:top-24"
        >
          <Eyebrow label={cfg.eyebrow} />
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground tracking-wide leading-[1.15]">
            <SplitReveal text={cfg.heading} />
          </h2>
          <p className="mt-4 text-muted text-sm md:text-[15px] font-light leading-[1.9] max-w-xl">
            {cfg.paragraph}
          </p>
        </motion.div>
        <div className="flex flex-col">
          {cfg.principles.map((p, prI) => (
            <motion.div
              key={`${p}-${prI}`}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: prI * 0.1 }}
              className="flex items-baseline gap-5 py-4 border-b border-foreground/10 last:border-b-0"
            >
              <span className="font-serif text-lg md:text-xl text-gold-dark/70 w-8 shrink-0 tabular-nums">
                {String(prI + 1).padStart(2, '0')}
              </span>
              <span className="font-[var(--font-poppins)] text-xs md:text-sm tracking-[0.2em] uppercase text-foreground/80">
                {p}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* C — dark section with gold pill tags */
function ApproachC({ cfg }: { cfg: ApproachCfg }) {
  return (
    <section className="relative w-full bg-[#161616] py-12 md:py-16 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <Eyebrow label={cfg.eyebrow} dark />
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-white tracking-wide leading-[1.15]">
            <SplitReveal text={cfg.heading} />
          </h2>
          <p className="mt-4 text-white/55 text-sm md:text-[15px] font-light leading-[1.9] max-w-2xl mx-auto">
            {cfg.paragraph}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {cfg.principles.map((p, prI) => (
            <span
              key={`${p}-${prI}`}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-4 py-1.5 font-[var(--font-poppins)] text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-gold hover:border-gold/70 hover:bg-gold/10 transition-all duration-400"
            >
              <span aria-hidden className="h-1 w-1 rounded-full bg-gold" />
              {p}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function Approach({ cfg, variant }: { cfg: ApproachCfg; variant: AboutVariant }) {
  if (variant === 1) return <ApproachB cfg={cfg} />
  if (variant === 2) return <ApproachC cfg={cfg} />
  return <ApproachA cfg={cfg} />
}
