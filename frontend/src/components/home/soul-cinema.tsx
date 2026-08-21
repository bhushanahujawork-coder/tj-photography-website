'use client'

import { motion } from 'framer-motion'
import { soulCinema } from '@/data/homepage'

export default function SoulCinema() {
  return (
    <section id="soul-cinema" className="relative w-full">
      <div className="relative w-full min-h-screen overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center grayscale"
          src="/cinema/cinema.mp4"
          poster="/cinema/poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%), linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 25%), linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.h2
            className="font-serif text-3xl md:text-6xl text-white tracking-wide"
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

        <div className="absolute bottom-[17%] left-1/2 -translate-x-1/2 z-10">
          <div
            className="w-20 h-20 md:w-24 md:h-24 tj-grain"
            role="img"
            aria-label="TJ Photography"
          />
        </div>

        <div className="absolute top-0 inset-x-0 h-[15%] bg-black" />
        <div className="absolute bottom-0 inset-x-0 h-[15%] bg-black" />
      </div>
    </section>
  )
}