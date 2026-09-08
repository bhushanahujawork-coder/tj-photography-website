'use client'

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import Navbar from '@/components/home/navbar'
import HeroSection from '@/components/home/hero-section'
import SoulCinema from '@/components/home/soul-cinema'
import MasonryPortfolio from '@/components/home/masonry-portfolio'
import Reviews from '@/components/home/reviews'
import ContactSection from '@/components/home/contact-section'
import Footer from '@/components/home/footer'
import WhatsappFloat from '@/components/home/whatsapp-float'
import ScrollProgress from '@/components/home/scroll-progress'
import EditorOverlays from '@/components/admin/editor-overlays'
import { HomeConfigProvider, useHomeConfig } from '@/lib/home-config/client'
import {
  parsePreviewMessage,
  sendToParent,
  TJ_PREVIEW_BRIDGE,
  type EditorMode,
  type ElementKey,
} from '@/lib/home-config/preview-bridge'
import type { HomeConfig, SectionId } from '@/lib/home-config/types'

const MIDDLE_RENDERERS: Record<string, ComponentType> = {
  hero: HeroSection,
  soulCinema: SoulCinema,
  portfolio: MasonryPortfolio,
  reviews: Reviews,
  contact: ContactSection,
}

const SECTION_LABELS: Record<string, string> = {
  header: 'Header',
  hero: 'Hero Image',
  soulCinema: 'Soul Cinema',
  portfolio: 'Portfolio',
  reviews: 'Reviews',
  contact: 'Contact',
  footer: 'Footer',
}

function SectionFrame({
  id,
  selected,
  hovering,
  onClick,
  onHover,
  mode,
  children,
  fixed = false,
}: {
  id: SectionId
  selected: boolean
  hovering: boolean
  onClick: () => void
  onHover: (hovering: boolean) => void
  mode: EditorMode
  children: ReactNode
  fixed?: boolean
}) {
  if (mode !== 'select') return <>{children}</>

  const outlined = selected || hovering
  return (
    <div
      data-section={id}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative cursor-pointer"
      title={`Edit ${SECTION_LABELS[id] ?? id}`}
    >
      {children}
      {outlined && (
        <span
          className={`pointer-events-none border-2 border-dashed ${
            selected ? 'border-gold bg-gold/[0.04]' : 'border-gold/70'
          } ${fixed ? 'fixed inset-0 z-[58]' : 'absolute inset-0 z-[58]'}`}
        />
      )}
      {selected && (
        <span className="absolute -top-3 right-3 z-[60] rounded-full bg-gold px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-black shadow-sm">
          {SECTION_LABELS[id] ?? id}
        </span>
      )}
    </div>
  )
}

function PreviewBody({ embed }: { embed: boolean }) {
  const { config, setConfig } = useHomeConfig()
  const [selected, setSelected] = useState<SectionId | null>(null)
  const [hovering, setHovering] = useState<SectionId | null>(null)
  const [mode, setMode] = useState<EditorMode>(embed ? 'select' : 'view')

  useEffect(() => {
    sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'ready' })
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = parsePreviewMessage(e.data)
      if (!msg) return
      if (msg.type === 'config') {
        setConfig(msg.config)
      } else if (msg.type === 'setMode') {
        setMode(msg.mode)
      } else if (msg.type === 'highlight') {
        setSelected(msg.section)
      } else if (msg.type === 'scrollTo') {
        if (msg.section === 'header') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        const el = document.querySelector(`[data-section="${msg.section}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setConfig])

  const select = useCallback((section: SectionId) => {
    setSelected(section)
    const element = (section === 'header' ? 'logo' : section) as ElementKey
    sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'element', section, element })
  }, [])

  const order = config.sectionOrder ?? []
  const middleIds = order.filter((id): id is SectionId => id in MIDDLE_RENDERERS)

  return (
    <>
      <ScrollProgress />
      <SectionFrame
        id="header"
        fixed
        selected={selected === 'header'}
        hovering={hovering === 'header'}
        onClick={() => select('header')}
        onHover={(h) => setHovering(h ? 'header' : null)}
        mode={mode}
      >
        <Navbar />
      </SectionFrame>
      <main>
        {middleIds.map((id) => {
          const Section = MIDDLE_RENDERERS[id]
          if (!Section) return null
          return (
            <SectionFrame
              key={id}
              id={id}
              selected={selected === id}
              hovering={hovering === id}
              onClick={() => select(id)}
              onHover={(h) => setHovering(h ? id : null)}
              mode={mode}
            >
              <Section />
            </SectionFrame>
          )
        })}
        <SectionFrame
          id="footer"
          selected={selected === 'footer'}
          hovering={hovering === 'footer'}
          onClick={() => select('footer')}
          onHover={(h) => setHovering(h ? 'footer' : null)}
          mode={mode}
        >
          <Footer />
        </SectionFrame>
      </main>
      <WhatsappFloat />
      {embed && <EditorOverlays mode={mode} />}
      <div className="fixed bottom-3 right-4 z-[95] hidden items-center gap-1.5 rounded-full bg-[#161616]/85 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        Draft · live preview
      </div>
    </>
  )
}

export function PreviewShell({ initialConfig, embed }: { initialConfig?: HomeConfig; embed?: boolean }) {
  return (
    <HomeConfigProvider
      source="draft"
      initialConfig={embed ? initialConfig : undefined}
      external={!!embed}
    >
      <PreviewBody embed={!!embed} />
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