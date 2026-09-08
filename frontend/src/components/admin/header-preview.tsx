'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { HeaderConfig } from '@/lib/home-config/types'
import { widthClassOf } from '@/lib/home-config/shared'
import { logoWidthAt } from '@/lib/home-config/responsive'

interface HeaderPreviewProps {
  header: HeaderConfig
  onChangeLogo: (patch: Partial<Record<'x' | 'y' | 'size', number>>) => void
  onChangeNav: (patch: { offset?: number }) => void
  width: number
}

const HEADER_H = 96 // md:h-24

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Value currently RENDERED at this width: a pinned override wins, otherwise global (fluid for size). */
function resolve(header: HeaderConfig, width: number) {
  const k = widthClassOf(width)
  const ov = k === 'desktop' ? null : header.overrides?.[k] ?? null
  const logo = header.logo
  const x = ov?.logo?.x ?? logo.x
  const y = ov?.logo?.y ?? logo.y
  const size = ov?.logo?.size ?? logoWidthAt(logo.size, Math.max(320, width))
  const offset = ov?.nav?.offset ?? header.nav.offset
  return { x, y, size, offset }
}

export default function HeaderPreview({ header, onChangeLogo, onChangeNav, width }: HeaderPreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const logoBoxRef = useRef<HTMLDivElement | null>(null)
  const navBoxRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    kind: 'logo' | 'nav'
    startX: number
    startY: number
    startLogoX: number
    startLogoY: number
    startOffsetX: number
  } | null>(null)
  const [selected, setSelected] = useState<'logo' | 'nav'>('logo')
  const [logoRect, setLogoRect] = useState<Rect | null>(null)
  const [navRect, setNavRect] = useState<Rect | null>(null)

  const effectiveWidth = Math.min(width, 1280)
  const isDesktop = width >= 1024 // matches the navbar's lg navigation switch
  const eff = resolve(header, width)
  const spacing = header.nav.spacing
  const logoW = logoRect?.width ?? 0
  const navW = navRect?.width ?? 0

  // Real-navbar model: navLeft = viewportWidth - navWidth - offset (offset keeps it at the right edge).
  const navLeft = effectiveWidth - navW - eff.offset
  const maxLogoX = Math.max(12, effectiveWidth - logoW - (navW > 0 ? navW + 36 : 0))
  const maxNavRight = Math.max(0, Math.min(effectiveWidth - navW - (logoW + eff.x + 36), effectiveWidth - navW - 12))

  useLayoutEffect(() => {
    const measure = () => {
      const stage = stageRef.current
      if (!stage) return
      const s = stage.getBoundingClientRect()
      if (logoBoxRef.current) {
        const r = logoBoxRef.current.getBoundingClientRect()
        setLogoRect({ left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height })
      }
      if (navBoxRef.current) {
        const r = navBoxRef.current.getBoundingClientRect()
        setNavRect({ left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height })
      }
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro && logoBoxRef.current) ro.observe(logoBoxRef.current)
    if (ro && navBoxRef.current) ro.observe(navBoxRef.current)
    return () => ro?.disconnect()
  }, [effectiveWidth, isDesktop, eff.size, eff.x, spacing, eff.offset])

  const startDrag = useCallback(
    (kind: 'logo' | 'nav') => (e: React.PointerEvent) => {
      e.preventDefault()
      setSelected(kind)
      dragRef.current = {
        kind,
        startX: e.clientX,
        startY: e.clientY,
        startLogoX: eff.x,
        startLogoY: eff.y,
        startOffsetX: eff.offset,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [eff.x, eff.y, eff.offset]
  )

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (drag.kind === 'logo') {
        const x = clamp(Math.round(drag.startLogoX + dx), 4, maxLogoX)
        const y = clamp(Math.round(drag.startLogoY + dy), -60, 60)
        onChangeLogo({ x, y })
      } else {
        const offset = Math.round(clamp(drag.startOffsetX - dx, -24, maxNavRight))
        onChangeNav({ offset })
      }
    },
    [maxLogoX, maxNavRight, onChangeLogo, onChangeNav]
  )

  const handleEnd = useCallback(() => {
    dragRef.current = null
  }, [])

  const sizePx = Math.round(eff.size)

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-lg border border-dashed border-black/20 bg-[#eae1d2]"
        style={{ width: '100%', maxWidth: effectiveWidth, height: HEADER_H, touchAction: 'none' }}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
      >
        <span className="absolute left-2 top-1 z-0 text-[8px] uppercase tracking-[0.2em] text-black/30">
          Header · previewing at {width}px {isDesktop ? '· full nav' : '· hamburger'} · {HEADER_H}px
        </span>

        {/* Real logo (fluid width at this preview width, height automatic) */}
        <div className="absolute top-0 z-10 flex h-full items-center min-w-0" style={{ left: eff.x, top: eff.y }}>
          <div ref={logoBoxRef} className="flex items-center shrink-0">
            {header.logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={header.logo.src}
                alt={header.logo.alt}
                style={{ width: sizePx, height: 'auto', maxWidth: '100%' }}
                draggable={false}
              />
            ) : (
              <span className="text-[10px] uppercase tracking-[0.15em] text-black/50">TJ Logo</span>
            )}
          </div>
        </div>

        {/* Real navigation: desktop links at ≥1024, hamburger button below */}
        <div className="absolute top-0 h-full flex items-center" style={{ left: navLeft }}>
          {isDesktop ? (
            <div
              ref={navBoxRef}
              className="flex items-center font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] font-medium whitespace-nowrap text-black/70"
              style={{ gap: `${spacing}px` }}
            >
              {header.nav.links.map((link) => (
                <span key={link.href} className="relative">
                  {link.label}
                </span>
              ))}
            </div>
          ) : (
            <div ref={navBoxRef} className="flex items-center justify-center" title="Menu button (hamburger)">
              <span className="flex h-7 w-9 items-center justify-center rounded-md border border-black/30 bg-black/5 text-[13px] leading-none text-black/70">
                ☰
              </span>
            </div>
          )}
        </div>

        {/* Logo selection box */}
        {logoRect && (
          <div
            onPointerDown={startDrag('logo')}
            className={`absolute z-20 flex items-center justify-center rounded border-2 transition-colors ${
              selected === 'logo'
                ? 'cursor-grabbing border-gold bg-gold/15'
                : 'cursor-grab border-gold/40 bg-gold/[0.04] hover:border-gold'
            }`}
            style={{ left: logoRect.left, top: logoRect.top, width: logoRect.width, height: logoRect.height }}
            title="Drag to position the logo"
          >
            <span className="text-[8px] uppercase tracking-[0.15em] font-semibold text-foreground/80 px-1 text-center leading-tight">
              LOGO{selected === 'logo' ? ' · drag' : ''}
            </span>
          </div>
        )}

        {/* Navigation selection box */}
        {navRect && (
          <div
            onPointerDown={startDrag('nav')}
            className={`absolute z-20 flex items-center justify-center rounded border-2 transition-colors ${
              selected === 'nav'
                ? 'cursor-grabbing border-gold bg-gold/15'
                : 'cursor-grab border-gold/40 bg-gold/[0.04] hover:border-gold'
            }`}
            style={{ left: navRect.left, top: navRect.top, width: navRect.width, height: navRect.height }}
            title={isDesktop ? 'Drag to position the navigation' : 'Drag to position the menu button'}
          >
            <span className="text-[8px] uppercase tracking-[0.15em] font-semibold text-foreground/80 px-1 text-center leading-tight">
              {isDesktop ? 'NAV' : 'MENU'}{selected === 'nav' ? ' · drag' : ''}
            </span>
          </div>
        )}

        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-black/35">
          <span>
            Logo · X {eff.x}px · Y {eff.y}px · Width {sizePx}px
          </span>
          <span>{isDesktop ? 'Nav offset' : 'Menu offset'} {eff.offset}px</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted">
        Reference at {width}px — drag the logo or navigation, or use the centre preview. One value set scales fluidly across every width.
      </p>
    </div>
  )
}