'use client'

import { motion } from 'framer-motion'
import { soulCinema } from '@/data/homepage'

const CLIP_PATH =
  'M 0.99950 0.03808 L 0.99987 0.86656 L 0.94138 0.82304 L 0.31875 0.99840 L 0.00000 0.73088 L 0.00000 0.05568 L 0.67100 0.29312 L 0.99950 0.03808 Z'

const RIM_GRADIENT =
  'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 50%, rgba(212,175,55,0.16) 100%)'

export default function SoulCinema() {
  return (
    <section id="soul-cinema" className="relative w-full pt-20">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="cinema-clip" clipPathUnits="objectBoundingBox">
            <path d={CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
      <div className="relative w-full h-[75vh] md:h-[90vh]">
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'url(#cinema-clip)',
            background: RIM_GRADIENT,
          }}
        />
        <div className="absolute inset-0" style={{ clipPath: 'url(#cinema-clip)' }}>
          <video
            className="absolute inset-0 w-full h-full object-cover object-center grayscale"
            src="/cinema/cinema.mp4"
            poster="/cinema/poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%), linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 22%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.4) 100%)',
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <motion.h2
              className="font-serif text-3xl md:text-6xl text-white mt-2 md:mt-4 tracking-wide"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              {soulCinema.title}
            </motion.h2>

            <motion.div
              className="w-16 h-px bg-gold mt-6 md:mt-8"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.35 }}
            />

            <motion.p
              className="text-white/70 text-sm md:text-lg max-w-2xl mt-5 md:mt-6 font-light leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              {soulCinema.description}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
