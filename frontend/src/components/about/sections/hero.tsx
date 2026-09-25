'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { AboutConfig, AboutVariant } from '@/lib/home-config/types'

type HeroCfg = AboutConfig['hero']

/* A — centered full-bleed (original design) */
function HeroA({ cfg }: { cfg: HeroCfg }) {
  return (
    <section data-hero className="relative w-full h-[62vh] md:h-[72vh] min-h-[420px] overflow-hidden bg-black">
      <Image
        src={cfg.image.src}
        alt={cfg.image.alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-serif text-4xl md:text-6xl text-white tracking-wide"
        >
          {cfg.title}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
          className="w-12 h-px bg-gold mt-5 origin-center"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.45 }}
          className="text-white/60 text-sm md:text-base mt-4 font-light tracking-wide"
        >
          {cfg.subtitle}
        </motion.p>
      </div>
    </section>
  )
}

/* B — left-aligned text over the image */
function HeroB({ cfg }: { cfg: HeroCfg }) {
  return (
    <section data-hero className="relative w-full h-[62vh] md:h-[72vh] min-h-[420px] overflow-hidden bg-black">
      <Image
        src={cfg.imageB.src}
        alt={cfg.imageB.alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-14 lg:px-20 max-w-3xl">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="text-gold text-[11px] md:text-xs tracking-[0.3em] uppercase font-medium"
        >
          TJ Photography
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="font-serif text-4xl md:text-6xl text-white tracking-wide leading-[1.1] mt-4"
        >
          {cfg.title}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          className="w-16 h-px bg-gold mt-5 origin-left"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="text-white/65 text-sm md:text-base mt-4 font-light tracking-wide max-w-md"
        >
          {cfg.subtitle}
        </motion.p>
      </div>
    </section>
  )
}

/* C — split: image one side, dark text panel the other */
function HeroC({ cfg }: { cfg: HeroCfg }) {
  return (
    <section data-hero className="relative w-full bg-black overflow-hidden flex flex-col md:flex-row min-h-[520px] md:min-h-[62vh]">
      <div className="relative w-full md:w-[55%] h-[40vh] md:h-auto min-h-[240px] md:min-h-full overflow-hidden">
        <Image
          src={cfg.imageC.src}
          alt={cfg.imageC.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/70" />
      </div>
      <div className="relative w-full md:w-[45%] flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 md:py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="text-gold text-[11px] md:text-xs tracking-[0.3em] uppercase font-medium"
        >
          TJ Photography
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-wide leading-[1.1] mt-4"
        >
          {cfg.title}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          className="w-16 h-px bg-gold mt-6 origin-left"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="text-white/65 text-sm md:text-base mt-5 font-light tracking-wide max-w-sm leading-relaxed"
        >
          {cfg.subtitle}
        </motion.p>
      </div>
    </section>
  )
}

export function Hero({ cfg, variant }: { cfg: HeroCfg; variant: AboutVariant }) {
  return (
    <>
      {variant === 1 ? <HeroB cfg={cfg} /> : variant === 2 ? <HeroC cfg={cfg} /> : <HeroA cfg={cfg} />}
    </>
  )
}
