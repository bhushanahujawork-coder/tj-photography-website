'use client'

import { motion } from 'framer-motion'

interface SectionHeadingProps {
  title: string
  description?: string
}

export default function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="text-center mb-8 md:mb-10">
      <motion.h2
        className="font-serif text-2xl md:text-4xl lg:text-5xl text-foreground tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          className="text-muted text-sm md:text-base max-w-xl mx-auto mt-4 font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
