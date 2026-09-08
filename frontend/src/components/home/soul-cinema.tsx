'use client'

import { motion } from 'framer-motion'
import { useHomeConfig } from '@/lib/home-config/client'

export default function SoulCinema() {
  const { config } = useHomeConfig()
  const soulCinema = config.soulCinema
  const type = soulCinema.type
  const frameColor = soulCinema.frame === 'black' ? '#000000' : 'var(--home-bg, #eae1d2)'
  const titleStyle: React.CSSProperties = {}
  if (type.fontFamily) titleStyle.fontFamily = type.fontFamily
  if (type.titleSize) titleStyle.fontSize = `${type.titleSize}rem`
  if (type.titleWeight) titleStyle.fontWeight = type.titleWeight
  if (type.titleColor) titleStyle.color = type.titleColor
  const bodyStyle: React.CSSProperties = {}
  if (type.fontFamily) bodyStyle.fontFamily = type.fontFamily
  if (type.bodySize) bodyStyle.fontSize = `${type.bodySize}rem`
  if (type.bodyColor) bodyStyle.color = type.bodyColor
  return (
    <section id="soul-cinema" className="relative w-full">
      <div className="relative w-full min-h-svh overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center grayscale"
          src={soulCinema.videoSrc}
          poster={soulCinema.poster}
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
            className="font-serif text-3xl md:text-6xl 2xl:text-7xl text-white tracking-wide"
            style={titleStyle}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {soulCinema.title}
          </motion.h2>

          <motion.div
            className="w-16 h-px bg-gold mt-6 md:mt-8"
            style={type.accent ? { backgroundColor: type.accent } : undefined}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.35 }}
          />

          <motion.p
            className="text-white/70 text-sm md:text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mt-5 md:mt-6 font-light leading-relaxed"
            style={bodyStyle}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            {soulCinema.description}
          </motion.p>
        </div>

        <div className="absolute bottom-[17%] left-1/2 -translate-x-1/2 z-10 [@media(max-height:32rem)]:hidden">
          <div
            className="w-20 h-20 md:w-24 md:h-24 tj-grain"
            role="img"
            aria-label="TJ Photography"
          />
        </div>

        <div className="absolute top-0 inset-x-0 h-[15%]" style={{ backgroundColor: frameColor }} />
        <div className="absolute bottom-0 inset-x-0 h-[15%]" style={{ backgroundColor: frameColor }} />
      </div>
    </section>
  )
}