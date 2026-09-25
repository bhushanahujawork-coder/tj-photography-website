'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Navbar from '@/components/home/navbar'
import WhatsappFloat from '@/components/home/whatsapp-float'
import { HomeConfigProvider, useHomeConfig } from '@/lib/home-config/client'
import { parsePreviewMessage, sendToParent, TJ_PREVIEW_BRIDGE } from '@/lib/home-config/preview-bridge'
import {
  ABOUT_SECTION_KEYS,
  ABOUT_VARIANT_COUNT,
  type AboutConfig,
  type AboutSectionKey,
  type AboutVariant,
  type HomeConfig,
} from '@/lib/home-config/types'
import { VariantStage } from './variant-stage'
import { Hero } from './sections/hero'
import { Quotes } from './sections/quotes'
import { Founders } from './sections/founders'
import { Approach } from './sections/approach'
import { Team } from './sections/team'

const STORAGE_PREFIX = 'tj-about-variant:'

const SECTION_LABELS: Record<AboutSectionKey, string> = {
  hero: 'Hero',
  quotes: 'Quotes',
  founders: 'Founders',
  approach: 'Approach',
  team: 'Team',
}

/** Design variant stored in the published config for a given section. */
function configVariant(a: AboutConfig, section: AboutSectionKey): AboutVariant {
  switch (section) {
    case 'hero':
      return a.hero.variant
    case 'quotes':
      return a.quotesVariant
    case 'founders':
      return a.founders.variant
    case 'approach':
      return a.approach.variant
    case 'team':
      return a.team.variant
  }
}

type VariantMap = Partial<Record<AboutSectionKey, AboutVariant>>

const EMPTY_VARIANTS: VariantMap = {}

/* Cached localStorage snapshot — stable reference between reads (useSyncExternalStore contract). */
let variantCacheKey: string | null = null
let variantCache: VariantMap = EMPTY_VARIANTS

function parseStoredVariants(raws: string[]): VariantMap {
  const out: VariantMap = {}
  for (let i = 0; i < ABOUT_SECTION_KEYS.length; i++) {
    const v = Number(raws[i])
    if (raws[i] !== '' && Number.isInteger(v) && v >= 0 && v < ABOUT_VARIANT_COUNT) {
      out[ABOUT_SECTION_KEYS[i]] = v as AboutVariant
    }
  }
  return out
}

function getStoredVariants(): VariantMap {
  if (typeof window === 'undefined') return EMPTY_VARIANTS
  const raws = ABOUT_SECTION_KEYS.map((section) => {
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + section) ?? ''
    } catch {
      return ''
    }
  })
  const key = raws.join('|')
  if (key !== variantCacheKey) {
    variantCacheKey = key
    variantCache = parseStoredVariants(raws)
  }
  return variantCache
}

function subscribeStoredVariants(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

/* Exact Films page footer — same structure, colors, spacing, behavior. */
function FilmsFooter() {
  return (
    <footer className="relative w-full bg-[#0a0a0a] border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/tj_photography_____/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 010-10 2 2 0 011.4-1.4 49.56 49.56 0 0116.2 0A2 2 0 0121.5 7a24.12 24.12 0 010 10 2 2 0 01-1.4 1.4 49.55 49.55 0 01-16.2 0A2 2 0 012.5 17z" />
                <path d="M10 9l5 3-5 3z" />
              </svg>
            </a>
          </div>

          <div className="border-t border-white/5 pt-8 w-full text-center">
            <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase">
              &copy; 2026 TJ Photography &nbsp;·&nbsp; All rights reserved &nbsp;·&nbsp; Designed by Bhushan Ahuja
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function AboutPageInner({ mode, embed }: { mode: 'public' | 'preview'; embed: boolean }) {
  const { config, setConfig } = useHomeConfig()
  const a = config.about

  /* Per-section design overrides (visitor choice / preview clicks). */
  const [over, setOver] = useState<VariantMap>({})

  /* Saved visitor choices (public page only). */
  const saved = useSyncExternalStore(
    subscribeStoredVariants,
    getStoredVariants,
    () => EMPTY_VARIANTS
  )

  /* Announce readiness + apply live config pushes from the editor. */
  useEffect(() => {
    if (embed) sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'ready' })
  }, [embed])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = parsePreviewMessage(e.data)
      if (!msg) return
      if (msg.type === 'config') setConfig(msg.config)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setConfig])

  if (!a) return null

  const variantOf = (section: AboutSectionKey): AboutVariant =>
    over[section] ?? (mode === 'public' ? saved[section] : undefined) ?? configVariant(a, section)

  const changeVariant = (section: AboutSectionKey, value: AboutVariant) => {
    setOver((prev) => ({ ...prev, [section]: value }))
    if (mode === 'public') {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + section, String(value))
      } catch {
        /* storage blocked — the choice lives for this render only */
      }
    } else {
      sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'aboutVariant', section, variant: value })
    }
  }

  return (
    <>
      <Navbar />

      {/* 01 — Studio hero */}
      <VariantStage
        label={SECTION_LABELS.hero}
        value={variantOf('hero')}
        onChange={(v) => changeVariant('hero', v)}
      >
        <Hero cfg={a.hero} variant={variantOf('hero')} />
      </VariantStage>

      {/* 02 — Quote band / cards */}
      <VariantStage
        label={SECTION_LABELS.quotes}
        value={variantOf('quotes')}
        onChange={(v) => changeVariant('quotes', v)}
      >
        <Quotes cfg={a.quotes} variant={variantOf('quotes')} />
      </VariantStage>

      {/* 03 — Founders */}
      <VariantStage
        label={SECTION_LABELS.founders}
        value={variantOf('founders')}
        onChange={(v) => changeVariant('founders', v)}
      >
        <Founders cfg={a.founders} variant={variantOf('founders')} />
      </VariantStage>

      {/* 04 — Our approach */}
      <VariantStage
        label={SECTION_LABELS.approach}
        value={variantOf('approach')}
        onChange={(v) => changeVariant('approach', v)}
      >
        <Approach cfg={a.approach} variant={variantOf('approach')} />
      </VariantStage>

      {/* 05 — Our team */}
      <VariantStage
        label={SECTION_LABELS.team}
        value={variantOf('team')}
        onChange={(v) => changeVariant('team', v)}
      >
        <Team cfg={a.team} variant={variantOf('team')} />
      </VariantStage>

      <FilmsFooter />
      <WhatsappFloat />
      {embed && (
        <div className="fixed bottom-3 right-4 z-[95] flex items-center gap-1.5 rounded-full bg-[#161616]/85 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm pointer-events-none">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Draft · about preview
        </div>
      )}
    </>
  )
}

/**
 * Renders the About page either live (published config) or inside the admin
 * editor (external draft pushed over the preview bridge).
 */
export function AboutPageEmbed({
  mode,
  initialConfig,
  embed = false,
}: {
  mode: 'public' | 'preview'
  initialConfig?: HomeConfig
  embed?: boolean
}) {
  if (mode === 'preview') {
    return (
      <HomeConfigProvider source="draft" initialConfig={embed ? initialConfig : undefined} external={embed}>
        <AboutPageInner mode="preview" embed={embed} />
        {!embed && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-[#161616] text-white text-xs px-5 py-2.5 shadow-xl border border-gold/40">
            <span className="text-gold uppercase tracking-wider text-[10px] font-semibold">Draft preview</span>
            <a href="/admin/editor" className="uppercase tracking-wider text-[10px] hover:text-gold transition-colors">
              Back to Editor
            </a>
          </div>
        )}
      </HomeConfigProvider>
    )
  }
  return (
    <HomeConfigProvider>
      <AboutPageInner mode="public" embed={false} />
    </HomeConfigProvider>
  )
}
