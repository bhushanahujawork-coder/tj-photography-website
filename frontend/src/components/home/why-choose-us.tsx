'use client'

import { motion } from 'framer-motion'
import { services } from '@/data/services'
import { whyChooseHeading } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'

export default function WhyChooseUs() {
  return (
    <section id="films" className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          title={whyChooseHeading.title}
          description={whyChooseHeading.description}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              className="group bg-card border border-border rounded-xl p-6 md:p-8 hover:border-gold/20 transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 text-lg">
                {service.icon}
              </div>
              <h3 className="font-serif text-lg md:text-xl text-foreground mb-2 tracking-wide">
                {service.title}
              </h3>
              <p className="text-muted text-sm font-light leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
