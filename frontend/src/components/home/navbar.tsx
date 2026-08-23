'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/data/site'

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0)
    }
    history.scrollRestoration = 'manual'
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

  const navColor = 'rgba(255, 255, 255, 0.92)'
  const navHover = '#E9C85B'
  const hamburgerColor = '#ffffff'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ textShadow: '0 1px 10px rgba(0, 0, 0, 0.45), 0 0 2px rgba(0, 0, 0, 0.3)' }}
    >
      <div className="relative mx-auto w-full max-w-[1600px] 3xl:max-w-[1900px] px-5 sm:px-6 h-20 md:h-24 flex items-center justify-between">
        <Link
          href="/"
          aria-label="TJ Photography — Home"
          className="inline-flex items-center shrink-0"
        >
          <Image
            src="/logo/tj-logo-white.png"
            alt="TJ Photography"
            width={3268}
            height={240}
            priority
            className="h-[11px] sm:h-3 md:h-[17px] xl:h-5 w-auto lg:ml-8 xl:ml-12"
            style={{ filter: 'drop-shadow(0 1px 6px rgba(0, 0, 0, 0.45))' }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 lg:mr-20">
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
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex flex-col gap-1.5 p-2.5 -mr-2.5"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.55))' }}
          aria-label="Open navigation menu"
        >
          <span className="block w-6 h-px" style={{ backgroundColor: hamburgerColor }} />
          <span className="block w-6 h-px" style={{ backgroundColor: hamburgerColor }} />
          <span className="block w-4 h-px" style={{ backgroundColor: hamburgerColor }} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-[#eae1d2] z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-20 px-6">
              <span className="flex items-baseline gap-1.5 font-[var(--font-poppins)] text-base text-black tracking-[0.08em]">
                <span className="font-bold">TJ</span>
                <span className="font-medium">PHOTOGRAPHY</span>
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
