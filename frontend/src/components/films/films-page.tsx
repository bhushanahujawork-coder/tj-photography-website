'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/home/navbar'
import WhatsappFloat from '@/components/home/whatsapp-float'
import { HomeConfigProvider, useHomeConfig } from '@/lib/home-config/client'
import { parsePreviewMessage, sendToParent, TJ_PREVIEW_BRIDGE } from '@/lib/home-config/preview-bridge'
import type { HomeConfig } from '@/lib/home-config/types'
import type { RectPayload } from '@/lib/home-config/preview-bridge'
import { FilmsGrid } from './films-grid'

function FilmPageInner({ embed }: { embed: boolean }) {
  const { setConfig } = useHomeConfig()
  const [mode, setMode] = useState<'select' | 'view'>(embed ? 'select' : 'view')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  /* Announce readiness + apply live config pushes from the editor. */
  useEffect(() => {
    if (embed) sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'ready' })
  }, [embed])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = parsePreviewMessage(e.data)
      if (!msg) return
      if (msg.type === 'config') {
        setConfig(msg.config)
      } else if (msg.type === 'setMode') {
        setMode(msg.mode)
      } else if (msg.type === 'filmHighlight') {
        setSelectedId(msg.id)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setConfig])

  const handleCardSelect = useCallback((id: string, rect: RectPayload) => {
    sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'filmSelect', id, rect })
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <section data-hero className="relative w-full h-[45vh] md:h-[50vh]">
          <div className="absolute inset-0 bg-black">
            <video
              className="absolute inset-0 w-full h-full object-cover object-center"
              src="/cinema/cinema.mp4"
              poster="/cinema/poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="font-serif text-2xl md:text-4xl text-white tracking-wide">
              <Link href="/" className="hover:text-gold transition-colors duration-300">
                TJ Photography
              </Link>
            </h2>
            <div className="w-12 h-px bg-gold mt-4" />
            <p className="text-white/50 text-sm md:text-base mt-4 font-light">
              Cinematic stories of love
            </p>
          </div>
        </section>

        <FilmsGrid
          editMode={embed && mode === 'select'}
          selectedId={selectedId}
          onSelect={handleCardSelect}
        />
      </main>

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

      <WhatsappFloat />
      {embed && (
        <div className="fixed bottom-3 right-4 z-[95] flex items-center gap-1.5 rounded-full bg-[#161616]/85 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm pointer-events-none">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Draft · films preview
        </div>
      )}
    </>
  )
}

/**
 * Renders the Films page either live (published config) or inside the admin
 * editor (external draft pushed over the preview bridge).
 */
export function FilmsPageEmbed({
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
      <HomeConfigProvider
        source="draft"
        initialConfig={embed ? initialConfig : undefined}
        external={embed}
      >
        <FilmPageInner embed={embed} />
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
      <FilmPageInner embed={false} />
    </HomeConfigProvider>
  )
}