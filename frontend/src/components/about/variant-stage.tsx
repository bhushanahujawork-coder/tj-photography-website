'use client'

import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ABOUT_VARIANT_COUNT, type AboutVariant } from '@/lib/home-config/types'
import { easeLux } from './sections/shared'

const LETTERS = ['A', 'B', 'C'] as const

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 md:w-[18px] md:h-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

/**
 * One About section + its A/B/C design switcher.
 *
 * - Crossfades between the three designs (popLayout keeps the section in flow,
 *   the outgoing design is lifted out so width/height follow the ACTIVE design).
 * - Arrows sit on the section edges; dots stack under the right arrow.
 * - Desktop: controls reveal on section hover. Touch widths: always visible.
 */
export function VariantStage({
  label,
  value,
  onChange,
  children,
}: {
  /** aria-label base, e.g. "Hero" → "Previous Hero design". */
  label: string
  value: AboutVariant
  onChange: (v: AboutVariant) => void
  children: ReactNode
}) {
  const go = (dir: -1 | 1) => {
    const next = (value + dir + ABOUT_VARIANT_COUNT) % ABOUT_VARIANT_COUNT
    onChange(next as AboutVariant)
  }

  const controlBase =
    'z-20 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover/vs:opacity-100 md:focus-visible:opacity-100 focus-visible:outline-none'

  return (
    <div className="relative group/vs overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: easeLux }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        aria-label={`Previous ${label} design`}
        onClick={() => go(-1)}
        className={`${controlBase} absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full border border-gold/40 bg-black/45 text-gold backdrop-blur-sm flex items-center justify-center hover:bg-black/75 hover:border-gold/70 transition-all duration-300`}
      >
        <Chevron dir="left" />
      </button>

      <div
        className={`${controlBase} absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5`}
      >
        <button
          type="button"
          aria-label={`Next ${label} design`}
          onClick={() => go(1)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gold/40 bg-black/45 text-gold backdrop-blur-sm flex items-center justify-center hover:bg-black/75 hover:border-gold/70 transition-all duration-300"
        >
          <Chevron dir="right" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/45 backdrop-blur-sm px-2 py-[7px]">
          {Array.from({ length: ABOUT_VARIANT_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show ${label} design ${LETTERS[i]}`}
              aria-current={i === value}
              onClick={() => onChange(i as AboutVariant)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === value ? 'w-4 bg-gold' : 'w-1.5 bg-white/50 hover:bg-white/85'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
