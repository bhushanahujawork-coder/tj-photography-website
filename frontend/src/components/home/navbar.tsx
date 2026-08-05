'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { site } from '@/data/site'

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight
      const y = window.scrollY
      const raw = (y / vh - 0.23) / (0.30 - 0.23)
      setScrollProgress(Math.min(1, Math.max(0, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
    const ids = site.nav.links.map((l) => l.href.replace('#', ''))
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    const weddingEl = document.getElementById('wedding')
    if (weddingEl) observer.observe(weddingEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const { links } = site.nav

  const logoColor = `rgb(${255 - scrollProgress * 255}, ${255 - scrollProgress * 255}, ${255 - scrollProgress * 255})`
  const navColor = `rgb(${255 - scrollProgress * 255}, ${255 - scrollProgress * 255}, ${255 - scrollProgress * 255})`
  const navHover = scrollProgress > 0.5 ? '#D4AF37' : '#ffffff'
  const bgColor = `rgba(255, 255, 255, ${scrollProgress})`
  const borderColor = `rgba(212, 175, 55, ${scrollProgress * 0.1})`
  const hamburgerColor = `rgb(${255 - scrollProgress * 255}, ${255 - scrollProgress * 255}, ${255 - scrollProgress * 255})`

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: bgColor, borderBottom: scrollProgress > 0 ? '1px solid ' + borderColor : 'none' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="font-[var(--font-poppins)] text-lg md:text-xl tracking-[0.1em] font-bold uppercase max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2 lg:-ml-[180px]"
          style={{ color: logoColor }}
        >
          {site.brand.name}
        </Link>

        <div className="flex items-center gap-2 lg:-mr-[30px]">
          <nav className="hidden lg:flex items-center gap-10">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative font-[var(--font-poppins)] text-[11px] tracking-[0.18em] uppercase font-medium"
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
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex flex-col gap-1.5 p-2 ml-4"
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
            className="fixed inset-0 bg-white z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-20 px-6 md:px-8">
              <span className="font-[var(--font-poppins)] text-lg text-black tracking-[0.08em] font-medium">
                {site.brand.name}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-black/60 hover:text-black text-2xl"
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
