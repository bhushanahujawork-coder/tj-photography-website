'use client'

import { motion } from 'framer-motion'
import type { AboutConfig, AboutVariant } from '@/lib/home-config/types'
import { Photo, SectionHeading } from './shared'

type FoundersCfg = AboutConfig['founders']

function FounderOverlay({ member }: { member: FoundersCfg['members'][number] }) {
  return (
    <div className="px-1 sm:text-center">
      <h3 className="font-serif text-xl md:text-2xl text-white tracking-wide">{member.name}</h3>
      <p className="mt-1 text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-gold">{member.role}</p>
      <p className="hidden sm:block mt-2 text-white/55 text-xs md:text-[13px] font-light leading-relaxed max-w-[28ch] sm:mx-auto">
        {member.bio}
      </p>
    </div>
  )
}

/* A — one full-bleed group photograph with names overlaid (original design) */
function FoundersA({ cfg }: { cfg: FoundersCfg }) {
  return (
    <section className="relative w-full bg-[#161616] pt-10 md:pt-14 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} dark />
      </div>
      <motion.figure
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative w-full h-[64vh] md:h-[80vh] min-h-[460px] overflow-hidden"
      >
        <Photo
          src={cfg.groupImage.src}
          alt={cfg.groupImage.alt}
          sizes="100vw"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <figcaption className="absolute bottom-0 inset-x-0">
          <div className="max-w-6xl mx-auto px-6 pb-7 md:pb-9 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center justify-center">
            {cfg.members.map((m, fI) => (
              <motion.div
                key={`${m.role}-${fI}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: fI * 0.12 }}
                className={fI > 0 ? 'sm:border-l sm:border-white/15 sm:pl-6' : 'text-center'}
              >
                <FounderOverlay member={m} />
              </motion.div>
            ))}
          </div>
        </figcaption>
      </motion.figure>
    </section>
  )
}

/* B — wide banner photo with member cards below (site background) */
function FoundersB({ cfg }: { cfg: FoundersCfg }) {
  return (
    <section className="relative w-full bg-background pt-12 md:pt-16 pb-12 md:pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} />
      </div>
      <motion.figure
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative w-full max-w-6xl mx-auto px-6"
      >
        <div className="relative w-full h-[38vh] md:h-[46vh] min-h-[260px] overflow-hidden border border-gold/30">
          <Photo
            src={cfg.groupImageB.src}
            alt={cfg.groupImageB.alt}
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </motion.figure>
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {cfg.members.map((m, i) => (
            <motion.article
              key={`${m.role}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.12 }}
              className={`group text-center pt-5 ${i > 0 ? 'sm:border-l sm:border-border sm:pl-8' : ''}`}
            >
              <h3 className="font-serif text-xl md:text-2xl text-foreground tracking-wide transition-colors duration-500 group-hover:text-gold-dark">
                {m.name}
              </h3>
              <p className="mt-1.5 text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-medium text-gold-dark">
                {m.role}
              </p>
              <p className="mt-2.5 text-foreground/70 text-[13px] md:text-sm font-light leading-relaxed max-w-[32ch] mx-auto">
                {m.bio}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* C — featured photo with member cards overlapping its base (site background) */
function FoundersC({ cfg }: { cfg: FoundersCfg }) {
  return (
    <section className="relative w-full bg-background py-14 md:py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} />

        <div className="relative">
          <motion.figure
            initial={{ opacity: 0, scale: 0.985 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative w-full overflow-hidden border border-gold/30"
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10]">
              <Photo
                src={cfg.groupImageC.src}
                alt={cfg.groupImageC.alt}
                sizes="(max-width: 1024px) 100vw, 960px"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </motion.figure>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="relative z-10 -mt-12 md:-mt-16 mx-3 md:mx-10 rounded-lg border border-border bg-white shadow-[0_18px_50px_-24px_rgba(22,22,22,0.35)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {cfg.members.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className="px-5 py-6 md:px-6 md:py-7 text-center"
                >
                  <h3 className="font-serif text-xl md:text-2xl text-foreground tracking-wide">
                    {m.name}
                  </h3>
                  <p className="mt-1.5 text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-medium text-gold-dark">
                    {m.role}
                  </p>
                  <p className="mt-2.5 text-[13px] md:text-sm font-light leading-relaxed text-foreground/70">
                    {m.bio}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export function Founders({ cfg, variant }: { cfg: FoundersCfg; variant: AboutVariant }) {
  if (variant === 1) return <FoundersB cfg={cfg} />
  if (variant === 2) return <FoundersC cfg={cfg} />
  return <FoundersA cfg={cfg} />
}
