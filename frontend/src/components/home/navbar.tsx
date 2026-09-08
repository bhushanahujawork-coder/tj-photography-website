'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useHomeConfig } from '@/lib/home-config/client'

export default function Navbar() {
  const { config } = useHomeConfig()
  const header = config.header
  const [activeSection, setActiveSection] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0)
    }
    history.scrollRestoration = 'manual'
  }, [])

  /* Solid (cream + dark) sticky header: transparent over the hero band, then
     flips to the light solid state once ~80% of the band is scrolled past. */
  useEffect(() => {
    const update = () => {
      const heroEl = document.querySelector<HTMLElement>('[data-hero]')
      if (!heroEl) {
        setSolid(true)
        return
      }
      const threshold = heroEl.getBoundingClientRect().height * 0.8
      setSolid(window.scrollY >= threshold)
    }
    const heroEl = document.querySelector<HTMLElement>('[data-hero]')
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = typeof ResizeObserver !== 'undefined' && heroEl ? new ResizeObserver(update) : null
    ro?.observe(heroEl as Element)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro?.disconnect()
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`)
          }
        })
      },
      { rootMargin: '-40% 0px -50% 0px' }
    )
    const ids = header.nav.links.map((l) => l.href.replace('#', ''))
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    const weddingEl = document.getElementById('wedding')
    if (weddingEl) observer.observe(weddingEl)
    return () => observer.disconnect()
  }, [header])

  useEffect(() => {
    if (!mobileOpen) return
    const scrollY = window.scrollY
    const { body } = document
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [mobileOpen])

  const { links } = header.nav

  const navColor = solid ? '#161616' : 'rgba(255, 255, 255, 0.92)'
  const navHover = solid ? '#9a7b14' : '#E9C85B'
  const hamburgerColor = solid ? '#161616' : '#ffffff'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      style={{
        background: solid ? 'var(--home-bg, #eae1d2)' : 'transparent',
        borderBottom: solid ? '1px solid rgba(22, 22, 22, 0.08)' : 'none',
        textShadow: solid
          ? 'none'
          : '0 1px 10px rgba(0, 0, 0, 0.45), 0 0 2px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="relative h-20 md:h-24">
        <div
          data-editor="logo"
          className="absolute top-0 z-10 flex h-full items-center min-w-0"
          style={{
            left: 'var(--tj-logo-x, 20px)',
            top: 'var(--tj-logo-y, 0px)',
            maxWidth: 'calc(100% - var(--tj-logo-x, 20px) - 12px)',
          }}
        >
          <Link
            href="/"
            aria-label={`${header.logo.alt} — Home`}
            className="inline-flex items-center shrink-0 min-w-0"
          >
            <Image
              src={header.logo.src}
              alt={header.logo.alt}
              width={3268}
              height={240}
              priority
              className="w-auto transition-[filter] duration-300"
              style={{
                filter: solid
                  ? 'invert(1)'
                  : 'drop-shadow(0 1px 6px rgba(0, 0, 0, 0.45))',
                width: 'var(--tj-logo-width, 272px)',
                height: 'auto',
                maxWidth: '100%',
              }}
            />
          </Link>
        </div>

        <div
          className="relative mx-auto w-full max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1700px] pl-6 pr-0 h-full flex items-center justify-end"
          style={{ marginRight: 'var(--tj-nav-offset, -14px)' }}
        >
          <nav
            data-editor="nav"
            className="hidden lg:flex items-center"
            style={{ gap: 'var(--tj-nav-spacing, 32px)' }}
          >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative font-[var(--font-poppins)] text-[11px] xl:text-xs tracking-[0.18em] uppercase font-medium whitespace-nowrap transition-colors duration-300"
              style={{ color: navColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = navHover}
              onMouseLeave={(e) => e.currentTarget.style.color = navColor}
            >
              {link.label}
              <span
                className="absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300"
                style={{ width: '100%', transform: activeSection === link.href ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }}
              />
            </a>
          ))}
        </nav>

        <button
          data-editor="nav"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex flex-col gap-1.5 p-2.5 -mr-2.5"
          style={solid ? undefined : { filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.55))' }}
          aria-label="Open navigation menu"
        >
          <span className="block w-6 h-px" style={{ backgroundColor: hamburgerColor }} />
          <span className="block w-6 h-px" style={{ backgroundColor: hamburgerColor }} />
          <span className="block w-4 h-px" style={{ backgroundColor: hamburgerColor }} />
        </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-[#eae1d2] z-50 flex flex-col overflow-y-auto overscroll-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-20 px-6 shrink-0">
              <span className="flex items-baseline gap-1.5 font-[var(--font-poppins)] text-base text-black tracking-[0.08em]">
                <span className="font-bold">TJ</span>
                <span className="font-medium">PHOTOGRAPHY</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-11 h-11 -mr-2 text-black/60 hover:text-black text-2xl"
                aria-label="Close navigation menu"
              >
                {'\u2715'}
              </button>
            </div>
            <nav className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="text-lg font-[var(--font-poppins)] text-black/70 hover:text-gold transition-colors tracking-[0.08em]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
