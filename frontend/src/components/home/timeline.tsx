'use client'

import { motion } from 'framer-motion'
import { timeline as timelineData } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'

const steps = [
  { step: '01', title: 'Booking', description: 'Your journey begins with a consultation where we discuss your vision, style, and the unique story you want to tell.' },
  { step: '02', title: 'Pre Wedding', description: 'Engagement shoots, venue scouting, and planning every detail to ensure your day is captured flawlessly.' },
  { step: '03', title: 'Wedding Day', description: 'Full-day coverage with two photographers, capturing every emotion, detail, and surprise as it unfolds.' },
  { step: '04', title: 'Editing', description: 'Every image is hand-edited with meticulous attention to color, tone, and composition.' },
  { step: '05', title: 'Online Gallery', description: 'Your private gallery is delivered within weeks, ready to view, share, and download.' },
  { step: '06', title: 'Album Delivery', description: 'Your custom-designed fine art album arrives at your door, preserving your memories for a lifetime.' },
]

export default function Timeline() {
  return (
    <section className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <SectionHeading
          title={timelineData.title}
          description={timelineData.description}
        />

        <div className="relative">
          <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent -translate-x-1/2" />

          <div className="flex flex-col gap-14 md:gap-20">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-8 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              >
                <div className="flex-1" />

                <div className="relative z-10 flex-shrink-0">
                  <div className="w-[46px] h-[46px] rounded-full border border-gold/40 bg-background flex items-center justify-center">
                    <span className="font-serif text-sm text-gold">{step.step}</span>
                  </div>
                </div>

                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <h3 className="font-serif text-lg md:text-xl text-foreground tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm font-light mt-2 leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
