'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useHomeConfig } from '@/lib/home-config/client'
import type { FilmAspect } from '@/lib/home-config/types'
import type { RectPayload } from '@/lib/home-config/preview-bridge'

function isRealText(value: string): boolean {
  if (!value) return false
  if (/^COUPLE \+ NAME$/i.test(value)) return false
  if (/^Wedding Film \d+$/i.test(value)) return false
  if (/^Wedding film details/.test(value)) return false
  return true
}

const ASPECT_CLASS: Record<FilmAspect, string> = {
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-video',
}

/** Fluid type/gap helpers — one global value, derived smoothly per viewport. */
function fluidFontSize(px: number): string {
  const min = Math.round(px * 0.81)
  const vw = (px / 10.24).toFixed(2)
  return `clamp(${min}px, ${vw}vw, ${px}px)`
}

function fluidGap(px: number): string {
  const min = Math.round(px * 0.6)
  const vw = (px / 14.4).toFixed(2)
  return `clamp(${min}px, ${vw}vw, ${px}px)`
}

function FilmCard({
  index,
  nameSize,
  descriptionSize,
  aspect,
  onOpen,
  editMode,
  selected,
  onSelect,
}: {
  index: number
  nameSize: number
  descriptionSize: number
  aspect: FilmAspect
  onOpen: (embedId: string, title: string) => void
  editMode: boolean
  selected: boolean
  onSelect: (id: string, rect: RectPayload) => void
}) {
  const { config } = useHomeConfig()
  const card = config.films?.cards[index]
  const [useMaxres, setUseMaxres] = useState(true)
  const thumbnail = card?.embedId
    ? `https://img.youtube.com/vi/${card.embedId}/${useMaxres ? 'maxresdefault' : 'hqdefault'}.jpg`
    : ''

  const fallbackTitle = card?.couple || 'Wedding Film'
  const showName = isRealText(card?.couple ?? '') ? card.couple : ''
  const showDescription = isRealText(card?.description ?? '') ? card.description : ''
  const aspectClass = ASPECT_CLASS[aspect] ?? ASPECT_CLASS['4/3']

  const handleClick = () => {
    if (!card) return
    if (editMode) {
      const node = cardRef.current
      const r = node?.getBoundingClientRect()
      if (r) onSelect(card.id, { left: r.left, top: r.top, width: r.width, height: r.height })
      return
    }
    if (card.embedId) onOpen(card.embedId, fallbackTitle)
  }

  const cardRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={cardRef}
      data-card-id={card?.id ?? ''}
      data-film-index={index}
      className="group relative cursor-pointer"
      onClick={handleClick}
    >
      <div className="film-card-scoop relative h-full flex flex-col bg-[#faf8f4] rounded-[18px] md:rounded-[22px] p-[12px] md:p-[14px] border border-[#e9e5dc] transition-all duration-500 group-hover:border-[#d4af37]/40 group-hover:shadow-2xl group-hover:shadow-black/15">
        <div className={`relative ${aspectClass} bg-[#1a1510] rounded-[14px] md:rounded-[16px] overflow-hidden`}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={showName || fallbackTitle}
              width={1280}
              height={720}
              onError={() => setUseMaxres(false)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/40 text-[10px] tracking-wider">
                {showName || fallbackTitle}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 px-[10px] pt-[12px] md:pt-[14px] pb-[20px] md:pb-[24px] min-h-[88px] md:min-h-[100px]">
          {showName ? (
            <h3
              className="font-serif text-[#1f2428] leading-snug"
              style={{ fontSize: fluidFontSize(nameSize) }}
            >
              {showName}
            </h3>
          ) : (
            <div className="w-[72%] h-[18px] md:h-[22px] rounded bg-[#efece5]" />
          )}
          {showDescription ? (
            <>
              <div className="mt-[14px] md:mt-[18px] h-px w-[120px] md:w-[140px] bg-[#e5e2dc]" />
              <p
                className="mt-[10px] md:mt-[12px] text-[#8a857e] leading-[1.55] line-clamp-2"
                style={{ fontSize: fluidFontSize(descriptionSize) }}
              >
                {showDescription}
              </p>
            </>
          ) : (
            <>
              <div className="mt-[14px] md:mt-[18px] h-px w-[120px] md:w-[140px] bg-[#e5e2dc]" />
              <div className="mt-[10px] md:mt-[12px] h-[10px] w-full max-w-[220px] rounded bg-[#f1eee7]" />
              <div className="mt-[6px] h-[10px] w-[62%] max-w-[160px] rounded bg-[#f1eee7]" />
            </>
          )}
        </div>
      </div>

      <span className="absolute -right-2 -bottom-2 w-12 h-12 md:-right-3 md:w-[64px] md:h-[64px] rounded-full bg-[#faf8f4] shadow-lg flex items-center justify-center transition-all duration-300 group-hover:bg-[#FF0000] group-hover:shadow-xl group-hover:shadow-red-500/50">
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-[#1f2428] transition-colors duration-300 group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </span>

      {editMode && (
        <span
          className={`pointer-events-none absolute -inset-[2px] z-[6] rounded-[20px] md:rounded-[24px] outline-2 outline-offset-2 transition-all duration-200 select-none  ${
            selected
              ? 'outline-gold shadow-[0_0_0_4px_rgba(212,175,55,0.18)]'
              : 'outline-gold/0 group-hover:outline-gold/70'
          }`}
        />
      )}
      {editMode && (
        <span
          className={`pointer-events-none absolute top-2 right-2 z-[7] flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-black shadow-sm transition-opacity duration-200 select-none ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          ✎ Edit
        </span>
      )}
    </div>
  )
}

export function FilmsGrid({
  editMode = false,
  selectedId = null,
  onSelect,
}: {
  editMode?: boolean
  selectedId?: string | null
  onSelect?: (id: string, rect: RectPayload) => void
}) {
  const { config } = useHomeConfig()
  const films = config.films?.cards ?? []
  const style = config.films?.style
  const nameSize = style?.nameSize ?? 21
  const descriptionSize = style?.descriptionSize ?? 13
  const aspect = style?.aspect ?? '4/3'
  const gap = style?.gap ?? 32
  const [active, setActive] = useState<{ embedId: string; title: string } | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)

  const openFilm = (embedId: string, title: string) => {
    setActive({ embedId, title })
    document.body.style.overflow = 'hidden'
  }

  const closeFilm = () => {
    setActive(null)
    document.body.style.overflow = ''
  }

  const handleSelect = (id: string, rect: RectPayload) => {
    if (onSelect && editMode) onSelect(id, rect)
  }

  /* Editor branch: keep reporting the selected card's rect while it moves with
     scroll / resize / font load / content (config push) so the parent popover tracks it. */
  useEffect(() => {
    if (!editMode || !selectedId || !onSelect) return
    let raf = 0
    let last = ''
    const measure = () => {
      raf = 0
      const el = gridRef.current?.querySelector(`[data-card-id="${selectedId}"]`)
      if (!el) return
      const r = el.getBoundingClientRect()
      const rect = { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
      const key = `${rect.left},${rect.top},${rect.width},${rect.height}`
      if (key !== last) {
        last = key
        onSelect(selectedId, rect)
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    schedule()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-card-id="${selectedId}"]`)
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(schedule) : null
    if (el && ro) ro.observe(el)
    document.fonts?.ready?.then(schedule).catch(() => {})
    const t = window.setTimeout(schedule, 150)
    return () => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [editMode, selectedId, onSelect, config.films?.cards])

  return (
    <>
      <section className="py-14 md:py-20 px-0">
        <div className="w-full max-w-[1920px] mx-auto px-5 sm:px-6 md:px-8 xl:px-14 2xl:px-16">
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: fluidGap(gap) }}
          >
            {films.map((_, i) => (
              <FilmCard
                key={films[i].id}
                index={i}
                nameSize={nameSize}
                descriptionSize={descriptionSize}
                aspect={aspect}
                onOpen={openFilm}
                editMode={editMode}
                selected={selectedId !== null && selectedId === films[i].id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </section>

      {!editMode && active && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex-col items-center justify-center flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFilm()
          }}
        >
          <div className="w-full max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-light tracking-wide">{active.title}</h3>
              <button
                onClick={closeFilm}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${active.embedId}?autoplay=1`}
                title="YouTube video player"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}