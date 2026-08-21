'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useScroll,
  useTransform,
} from 'framer-motion'
import Navbar from '@/components/home/navbar'
import Footer from '@/components/home/footer'
import WhatsappFloat from '@/components/home/whatsapp-float'
import { about, type AboutMember } from '@/data/about'

const easeLux = [0.22, 1, 0.36, 1] as const

function Eyebrow({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span
      className={`text-[11px] md:text-xs tracking-[0.3em] uppercase font-medium ${
        dark ? 'text-gold' : 'text-gold-dark'
      }`}
    >
      {label}
    </span>
  )
}

function SplitReveal({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="inline-block"
            initial={{ y: '115%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.75, ease: easeLux, delay: i * 0.055 }}
          >
            {word}
            {'\u00A0'}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

function SectionHeading({
  eyebrow,
  heading,
  subtitle,
  dark = false,
}: {
  eyebrow: string
  heading: string
  subtitle?: string
  dark?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex flex-col items-center text-center mb-6 md:mb-8"
    >
      <Eyebrow label={eyebrow} dark={dark} />
      <h2
        className={`mt-3 font-serif text-3xl md:text-4xl tracking-wide leading-[1.15] ${
          dark ? 'text-white' : 'text-foreground'
        }`}
      >
        <SplitReveal text={heading} />
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm md:text-[15px] font-light leading-relaxed max-w-lg ${
            dark ? 'text-white/50' : 'text-muted'
          }`}
        >
          {subtitle}
        </p>
      )}
      <motion.div
        className={`mt-4 w-14 h-px origin-left ${dark ? 'bg-gold' : 'bg-gold-dark'}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </motion.div>
  )
}

function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (src.endsWith('.svg')) {
    return <img src={src} alt={alt} className={className} />
  }
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" className={className} />
}

function GoldDust() {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 7.3 + 3) % 100}%`,
        bottom: `${(i * 5.1 + 4) % 90}%`,
        size: 2 + (i % 3),
        duration: 5 + (i % 5),
        delay: (i * 0.7) % 4,
        opacity: 0.25 + (i % 4) * 0.13,
      })),
    []
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold"
          style={{ left: d.left, bottom: d.bottom, width: d.size, height: d.size, opacity: d.opacity }}
          animate={{ y: [0, -70, 0], opacity: [0, d.opacity, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function GlowSection({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 50, damping: 15 })
  const sy = useSpring(y, { stiffness: 50, damping: 15 })
  const bg = useMotionTemplate`radial-gradient(340px circle at ${sx}px ${sy}px, rgba(212,175,55,0.13), transparent 70%)`

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  return (
    <section ref={ref} onMouseMove={onMouseMove} className={`relative ${className}`}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        style={{ background: bg }}
      />
      <div className="relative z-10">{children}</div>
    </section>
  )
}

function Marquee() {
  return (
    <div className="relative w-full bg-[#0a0a0a] py-3 md:py-4 border-y border-gold/10 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee w-max">
        {[0, 1, 2, 3].map((dup) => (
          <div key={dup} className="flex items-center shrink-0" aria-hidden={dup > 0}>
            {about.marquee.items.map((item, i) => (
              <span key={i} className="flex items-center px-5 md:px-7">
                <span className="text-gold/80 text-[11px] md:text-sm tracking-[0.45em] uppercase font-medium">
                  {item}
                </span>
                <span className="text-gold/40 text-xs ml-5 md:ml-7" aria-hidden>
                  {'\u2726'}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function QuoteBand() {
  const quotes = about.quotes
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % quotes.length), 5000)
    return () => clearInterval(t)
  }, [quotes.length])

  return (
    <section className="relative w-full bg-[#0a0a0a] py-8 md:py-10 overflow-hidden">
      <GoldDust />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-gold/30 font-serif text-5xl md:text-6xl leading-none select-none" aria-hidden>
          {'\u201C'}
        </span>
        <div className="relative min-h-[120px] md:min-h-[100px] -mt-2">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={i}
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <p className="font-serif text-lg md:text-2xl text-white/90 leading-relaxed tracking-wide max-w-2xl">
                {quotes[i].text}
              </p>
              <p className="mt-3 text-gold text-[10px] md:text-xs tracking-[0.3em] uppercase">
                {quotes[i].label}
              </p>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {quotes.map((_, di) => (
            <button
              key={di}
              onClick={() => setI(di)}
              aria-label={`Quote ${di + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                di === i ? 'w-7 bg-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function LeadershipCard({ member, index }: { member: AboutMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.09 }}
      className="group"
    >
      <div className="relative rounded-2xl border border-gold/20 transition-all duration-500 group-hover:border-gold/60 group-hover:shadow-[0_0_45px_rgba(212,175,55,0.18)]">
        <span
          aria-hidden
          className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-gold/70 rounded-tl-2xl z-20 pointer-events-none"
        />
        <span
          aria-hidden
          className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-gold/70 rounded-tr-2xl z-20 pointer-events-none"
        />
        <span
          aria-hidden
          className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-gold/70 rounded-bl-2xl z-20 pointer-events-none"
        />
        <span
          aria-hidden
          className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-gold/70 rounded-br-2xl z-20 pointer-events-none"
        />
        <div className="p-2 md:p-3">
          <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-xl bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:scale-[1.05] group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-black/60">
            <Photo
              src={member.image}
              alt={member.name || member.role}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {member.name && (
                <h3 className="font-[var(--font-poppins)] font-semibold text-white text-base tracking-wide">
                  {member.name}
                </h3>
              )}
              <p className={`text-[10px] tracking-[0.25em] uppercase text-gold ${member.name ? 'mt-0.5' : ''}`}>
                {member.role}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-white/50 text-xs md:text-[13px] font-light leading-relaxed text-center px-1">
        {member.bio}
      </p>
    </motion.div>
  )
}

function TeamCard({ member, index }: { member: AboutMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: index % 2 ? 2 : -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: (index % 4) * 0.08 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-black/5 aspect-[3/4]">
        <Photo
          src={member.image}
          alt={member.name || member.role}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden lg:block">
          {member.name && (
            <p className="font-[var(--font-poppins)] font-medium text-white text-sm tracking-wide">
              {member.name}
            </p>
          )}
          <p className={`text-[10px] tracking-[0.2em] uppercase text-gold ${member.name ? 'mt-0.5' : ''}`}>
            {member.role}
          </p>
        </div>
      </div>
      <div className="mt-2.5 text-center lg:hidden">
        {member.name && (
          <h3 className="font-[var(--font-poppins)] font-medium text-sm text-foreground tracking-wide">
            {member.name}
          </h3>
        )}
        <p className={`text-[10px] tracking-[0.2em] uppercase text-gold-dark ${member.name ? 'mt-0.5' : ''}`}>
          {member.role}
        </p>
      </div>
    </motion.div>
  )
}

export default function AboutPage() {
  const storyRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [45, -45])

  return (
    <>
      <Navbar />

      {/* 01 — Our Story */}
      <section
        ref={storyRef}
        className="relative w-full bg-[#eae1d2] pt-8 md:pt-10 pb-6 md:pb-8 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-lg"
          >
            <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-wide leading-[1.1]">
              <SplitReveal text={about.story.heading} />
            </h1>
            <div className="mt-2 md:mt-3 font-serif italic text-2xl md:text-[26px] text-gold-dark tracking-wide">
              <SplitReveal text={about.story.accent} />
            </div>
            <motion.div
              className="mt-3 w-16 h-px origin-left bg-gold-dark"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
            />
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start mt-5 md:mt-6">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:pt-12"
            >
              {about.story.paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  className={
                    i === 0
                      ? 'mt-6 border-l-2 border-gold-dark pl-5 md:pl-6 text-[#2f2a20] font-serif text-xl md:text-2xl leading-[1.65] tracking-wide'
                      : 'mt-4 border-l-2 border-gold-dark/50 pl-5 md:pl-6 text-muted text-sm md:text-[15px] font-light leading-[1.95] tracking-[0.01em]'
                  }
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 + i * 0.15 }}
                >
                  {p}
                </motion.p>
              ))}
              <div className="mt-8 border-t border-gold/25 pt-6 flex">
                {about.story.stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    className={`flex-1 ${i > 0 ? 'border-l border-gold/25 pl-4 md:pl-6' : ''} ${i < about.story.stats.length - 1 ? 'pr-4 md:pr-6' : ''}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                  >
                    <p className="font-[var(--font-poppins)] font-semibold text-2xl md:text-3xl text-gold-dark leading-none">
                      {s.value}
                    </p>
                    <p className="mt-2 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-muted/80 leading-snug">
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative max-w-md lg:max-w-lg mx-auto w-full"
            >
              <div className="absolute -inset-3 md:-inset-4 border border-gold/30 rounded-xl translate-x-3 translate-y-3 rotate-[-3deg]" />
              <div className="relative rounded-xl overflow-hidden aspect-[4/5] shadow-xl shadow-black/20 rotate-[-2deg]">
                <motion.div className="absolute inset-0" style={{ y: imgY }}>
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Photo
                      src={about.story.image}
                      alt={about.story.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </motion.div>
              </div>

              <motion.div
                className="absolute -left-3 md:-left-8 -bottom-5 md:-bottom-8 w-24 md:w-36 rotate-[-9deg] z-10"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="bg-white p-1.5 md:p-2 shadow-xl shadow-black/25">
                  <img
                    src={about.story.polaroids[0].src}
                    alt={about.story.polaroids[0].alt}
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-3 md:-right-6 top-5 md:top-8 w-20 md:w-32 rotate-[10deg] z-10 hidden sm:block"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              >
                <div className="bg-white p-1.5 md:p-2 shadow-xl shadow-black/25">
                  <img
                    src={about.story.polaroids[1].src}
                    alt={about.story.polaroids[1].alt}
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* 02 — Leadership */}
      <GlowSection className="w-full bg-[#161616] py-8 md:py-12 overflow-hidden">
        <GoldDust />
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow={about.leadership.eyebrow}
            heading={about.leadership.heading}
            dark
          />
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
            {about.leadership.members.map((m, i) => (
              <LeadershipCard key={m.role} member={m} index={i} />
            ))}
          </div>
        </div>
      </GlowSection>

      <QuoteBand />

      {/* 03 — The Team */}
      <section className="relative w-full bg-[#eae1d2] py-8 md:py-12 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow={about.team.eyebrow}
            heading={about.team.heading}
            subtitle={about.team.subtitle}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {about.team.members.map((m, i) => (
              <TeamCard key={m.role + i} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Marquee />

      {/* 04 — As Seen In */}
      <GlowSection className="w-full bg-[#161616] py-8 md:py-10 overflow-hidden">
        <GoldDust />
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeading
            eyebrow={about.cities.eyebrow}
            heading={about.cities.heading}
            subtitle={about.cities.caption}
            dark
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 max-w-3xl mx-auto">
            {about.cities.cities.map((city, i) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.12 }}
                className="group rounded-xl border border-gold/20 bg-white/5 px-4 py-5 md:py-6 text-center transition-colors duration-500 hover:border-gold/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 md:w-6 md:h-6 text-gold/80 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="mt-2.5 font-[var(--font-poppins)] text-sm md:text-base tracking-[0.25em] uppercase text-white">
                  {city}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-gold/60">
                  Weddings
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </GlowSection>

      {/* CTA */}
      <GlowSection className="w-full bg-[#0a0a0a] py-8 md:py-10 border-t border-gold/10">
        <GoldDust />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h2 className="font-serif text-3xl md:text-5xl text-white tracking-wide leading-[1.15]">
              <SplitReveal text="Ready to Tell" />
              <span className="text-gold">
                <SplitReveal text="Your Story?" />
              </span>
            </h2>
            <motion.div
              className="mt-5 w-14 h-px bg-gold mx-auto origin-center"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
            />
            <p className="mt-4 text-white/50 text-sm md:text-[15px] font-light max-w-xl mx-auto leading-relaxed">
              Every love story is unique. Let our team capture yours with the
              artistry and elegance it deserves.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/919033320304?text=Hi%20TJ%20Photography%2C%20I%20want%20to%20book%20my%20wedding%20shoot."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-10 py-4 bg-[#25D366] text-white text-xs md:text-sm tracking-[0.25em] uppercase font-semibold hover:bg-[#1fb958] transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </GlowSection>

      <Footer />
      <WhatsappFloat />
    </>
  )
}
