'use client'

import { motion } from 'framer-motion'
import { instagram } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'

const placeholders = Array.from({ length: 8 }, (_, i) => ({
  id: `ig-${i}`,
  alt: 'Instagram photo preview',
}))

export default function InstagramFeed() {
  return (
    <section className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading title={instagram.title} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {placeholders.map((item, i) => (
            <motion.div
              key={item.id}
              className="aspect-square bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a] rounded-md relative group cursor-pointer overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-gold text-sm">{'\uD83D\uDCF7'}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <a
            href={instagram.followUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 border border-white/20 text-foreground text-sm rounded-lg hover:border-gold/50 hover:text-gold transition-all duration-300 tracking-wide"
          >
            <span>{'\uD83D\uDC8D'}</span>
            Follow {instagram.username}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
