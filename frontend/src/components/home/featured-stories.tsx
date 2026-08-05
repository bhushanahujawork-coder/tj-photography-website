'use client'

import { motion } from 'framer-motion'
import { stories } from '@/data/stories'
import { storiesHeading } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'
import ImageCard from '@/components/ui/image-card'

export default function FeaturedStories() {
  return (
    <section className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          title={storiesHeading.title}
          description={storiesHeading.description}
        />

        <div className="flex flex-col gap-16 md:gap-24">
          {stories.map((story, i) => (
            <motion.article
              key={story.id}
              className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${
                i % 2 === 1 ? 'md:direction-rtl' : ''
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className={`${i % 2 === 1 ? 'md:order-2' : ''}`}>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <ImageCard
                    {...story.coverImage}
                    width={800}
                    height={1000}
                    className="w-full h-full"
                    priority={i === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>

              <div className={`${i % 2 === 1 ? 'md:order-1 md:text-right' : ''}`}>
                <span className="text-gold/60 text-xs tracking-[0.15em] uppercase font-light">
                  Featured Story
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-foreground mt-3 tracking-wide">
                  {story.bride} & {story.groom}
                </h3>
                <p className="text-muted text-sm mt-2 font-light">
                  {story.location} &middot; {story.date}
                </p>
                <p className="text-white/70 text-sm md:text-base mt-5 font-light leading-relaxed">
                  {story.excerpt}
                </p>
                <a
                  href={story.slug ? `/story/${story.slug}` : '#'}
                  className="inline-flex items-center gap-2 mt-6 text-sm text-gold hover:text-gold-light transition-colors tracking-wide"
                >
                  View Gallery
                  <span className="text-xs">{'\u2192'}</span>
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
