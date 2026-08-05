'use client'

import { motion } from 'framer-motion'
import { site } from '@/data/site'

export default function CTASection() {
  const { cta } = site

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.h2
          className="font-serif text-3xl md:text-5xl text-foreground tracking-wide leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {cta.heading}
        </motion.h2>

        <motion.p
          className="text-muted text-sm md:text-base mt-5 font-light leading-relaxed max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {cta.description}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <a
            href={cta.primaryButton.href}
            className="h-12 px-8 bg-gold text-black text-sm font-semibold tracking-wider rounded-lg flex items-center justify-center hover:bg-gold-light transition-colors duration-300"
          >
            {cta.primaryButton.label}
          </a>
          <a
            href={cta.secondaryButton.href}
            className="h-12 px-8 border border-white/20 text-foreground text-sm font-medium tracking-wider rounded-lg flex items-center justify-center hover:border-gold/50 hover:text-gold transition-all duration-300"
          >
            {cta.secondaryButton.label}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
