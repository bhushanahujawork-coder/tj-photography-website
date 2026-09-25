'use client'

import { motion } from 'framer-motion'
import type { AboutConfig, AboutVariant } from '@/lib/home-config/types'
import { Photo, SectionHeading } from './shared'

type TeamCfg = AboutConfig['team']

/* A — circular avatars in a 5-column grid (original design) */
function TeamA({ cfg }: { cfg: TeamCfg }) {
  return (
    <section className="relative w-full bg-[#eae1d2] pb-12 md:pb-16 pt-6 md:pt-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} subtitle={cfg.subtitle} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {cfg.members.map((m, tI) => (
            <TeamAvatarCard key={`${m.image}-${tI}`} member={m} index={tI} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamAvatarCard({ member, index }: { member: TeamCfg['members'][number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: (index % 5) * 0.07 }}
      className="group flex flex-col items-center text-center"
    >
      <div className="relative w-full max-w-[168px] aspect-square rounded-full overflow-hidden border border-gold/25 bg-[#141414] transition-all duration-500 group-hover:border-gold/60 group-hover:shadow-[0_0_35px_rgba(212,175,55,0.18)]">
        <Photo
          src={member.image}
          alt={member.name || member.role}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 rounded-full bg-gold/0 group-hover:bg-gold/5 transition-colors duration-500" />
      </div>
      <div className="mt-3.5 transition-transform duration-500 group-hover:-translate-y-0.5">
        {member.name && (
          <h3 className="font-[var(--font-poppins)] font-medium text-sm md:text-[15px] text-foreground tracking-wide">
            {member.name}
          </h3>
        )}
        <p
          className={`text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-gold-dark ${member.name ? 'mt-1' : ''}`}
        >
          {member.role}
        </p>
      </div>
    </motion.div>
  )
}

/* B — rectangular portrait cards */
function TeamB({ cfg }: { cfg: TeamCfg }) {
  return (
    <section className="relative w-full bg-[#eae1d2] py-12 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} subtitle={cfg.subtitle} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {cfg.members.map((m, tI) => (
            <motion.article
              key={`${m.image}-${tI}`}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: (tI % 5) * 0.07 }}
              className="group"
            >
              <div className="relative w-full aspect-[4/5] overflow-hidden border border-gold/25 bg-[#141414] transition-all duration-500 group-hover:border-gold/60 group-hover:shadow-[0_0_35px_rgba(212,175,55,0.15)]">
                <Photo
                  src={m.image}
                  alt={m.name || m.role}
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 md:p-4">
                  <p className="font-[var(--font-poppins)] font-medium text-xs md:text-sm text-white tracking-wide">
                    {m.name || m.role}
                  </p>
                  <p className="mt-0.5 text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-gold">
                    {m.role}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* C — compact rows, 2-column list with thin gold rule */
function TeamC({ cfg }: { cfg: TeamCfg }) {
  return (
    <section className="relative w-full bg-[#eae1d2] py-12 md:py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading eyebrow={cfg.eyebrow} heading={cfg.heading} subtitle={cfg.subtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          {cfg.members.map((m, tI) => (
            <motion.div
              key={`${m.image}-${tI}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: (tI % 6) * 0.06 }}
              className="group flex items-center gap-4 py-4 border-b border-foreground/10"
            >
              <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-full border border-gold/30 bg-[#141414] transition-all duration-500 group-hover:border-gold/70">
                <Photo
                  src={m.image}
                  alt={m.name || m.role}
                  sizes="56px"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-[var(--font-poppins)] font-medium text-sm md:text-[15px] text-foreground tracking-wide truncate">
                  {m.name || m.role}
                </h3>
                <p className="mt-0.5 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-gold-dark truncate">
                  {m.role}
                </p>
              </div>
              <span aria-hidden className="ml-auto h-px flex-1 bg-gradient-to-r from-gold-dark/40 to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Team({ cfg, variant }: { cfg: TeamCfg; variant: AboutVariant }) {
  if (variant === 1) return <TeamB cfg={cfg} />
  if (variant === 2) return <TeamC cfg={cfg} />
  return <TeamA cfg={cfg} />
}
