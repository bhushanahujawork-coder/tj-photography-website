'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  sendToParent,
  TJ_PREVIEW_BRIDGE,
  type DragElement,
  type EditorMode,
} from '@/lib/home-config/preview-bridge'

interface Box {
  left: number
  top: number
  width: number
  height: number
}

function rectOf(el: Element | null): Box | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/**
 * Pick the navigation element currently visible at the preview breakpoint:
 * desktop <nav> on wide widths, the hamburger button below its visibility breakpoint.
 */
function visibleNavElement(): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-editor="nav"]'))
  return els.find((el) => el.offsetParent !== null) ?? null
}

/**
 * Editor-only overlays injected into the centre preview iframe.
 * Visible only in SELECT mode. Renders a gold outline + label over the real
 * logo and navigation and lets the admin select / drag them directly.
 * All drag decisions (values + clamping) are computed by the parent editor.
 */
export default function EditorOverlays({ mode }: { mode: EditorMode }) {
  const [hover, setHover] = useState<DragElement | null>(null)
  const [selected, setSelected] = useState<DragElement | null>('logo')
  const [logoBox, setLogoBox] = useState<Box | null>(null)
  const [navBox, setNavBox] = useState<Box | null>(null)
  const dragRef = useRef<{ element: DragElement; px: number; py: number; moved: boolean } | null>(null)
  const boxEls = useRef<Partial<Record<DragElement, HTMLDivElement | null>>>({})

  const measure = useCallback(() => {
    const logoEl = document.querySelector('[data-editor="logo"] img')
    const navEl = visibleNavElement()
    setLogoBox(rectOf(logoEl))
    setNavBox(rectOf(navEl))
  }, [])

  useEffect(() => {
    if (mode !== 'select') return
    const raf = window.requestAnimationFrame(measure)
    const els = Array.from(document.querySelectorAll('[data-editor="logo"] img,[data-editor="nav"]'))
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) els.forEach((el) => ro.observe(el))
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    document.fonts?.ready?.then(measure).catch(() => {})
    return () => {
      window.cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [mode, measure])

  const startDrag = useCallback(
    (element: DragElement) => (e: React.PointerEvent) => {
      if (mode !== 'select') return
      e.preventDefault()
      e.stopPropagation()
      setSelected(element)
      const headerEl = document.querySelector('[data-section="header"] header')
      const header = rectOf(headerEl)
      const logoEl = document.querySelector('[data-editor="logo"] img')
      const navEl = visibleNavElement()
      const box = element === 'logo' ? rectOf(logoEl) : rectOf(navEl)
      if (!header || !box) return
      const other = element === 'logo' ? rectOf(navEl) : rectOf(logoEl)
      dragRef.current = { element, px: e.clientX, py: e.clientY, moved: false }
      sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'dragstart', element, header, box, other })
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [mode]
  )

  const handleMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.px
    const dy = e.clientY - drag.py
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true
    if (drag.moved) {
      sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'dragmove', element: drag.element, dx, dy })
      const el = boxEls.current[drag.element]
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }, [])

  const releaseDrag = useCallback(
    (element: DragElement | null) => {
      if (!element) return
      const el = boxEls.current[element]
      if (el) el.style.transform = ''
      measure()
      dragRef.current = null
    },
    [measure]
  )

  const handleUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.moved) {
      sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'element', section: 'header', element: drag.element })
    }
    sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'dragend', element: drag.element })
    releaseDrag(drag.element)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }, [releaseDrag])

  const handleCancel = useCallback(() => {
    if (dragRef.current) {
      sendToParent({ bridge: TJ_PREVIEW_BRIDGE, type: 'dragend', element: dragRef.current.element })
      releaseDrag(dragRef.current.element)
    }
  }, [releaseDrag])

  useEffect(() => {
    if (mode !== 'select') {
      dragRef.current = null
    }
  }, [mode])

  if (mode !== 'select') return null

  const boxes: { tag: DragElement; label: string; box: Box }[] = []
  if (logoBox && logoBox.width > 0 && logoBox.height > 0) {
    boxes.push({ tag: 'logo', label: 'LOGO', box: logoBox })
  }
  if (navBox && navBox.width > 0 && navBox.height > 0) {
    boxes.push({ tag: 'nav', label: 'NAVIGATION', box: navBox })
  }

  return (
    <div className="fixed inset-0 z-[85] pointer-events-none">
      {boxes.map((b) => {
        const isSel = selected === b.tag
        const isHov = hover === b.tag
        const chip = `${b.label}${isSel ? ' · DRAG TO MOVE' : ' · CLICK TO EDIT'}`
        const fitsAbove = b.box.top - 20 >= 0
        const chipTop = fitsAbove ? b.box.top - 20 : b.box.top + b.box.height + 4
        return (
          <div
            key={b.tag}
            ref={(el) => {
              boxEls.current[b.tag] = el
            }}
            className="absolute"
            style={{
              left: b.box.left,
              top: b.box.top,
              width: b.box.width,
              height: b.box.height,
            }}
          >
            <div
              onPointerDown={startDrag(b.tag)}
              onPointerMove={handleMove}
              onPointerUp={handleUp}
              onPointerCancel={handleCancel}
              onMouseEnter={() => setHover(b.tag)}
              onMouseLeave={() => setHover(null)}
              title={b.tag === 'logo' ? 'Logo — drag to move' : 'Navigation — drag to move'}
              className={`absolute inset-0 pointer-events-auto transition-[outline,outline-offset,background-color] ${
                isSel ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                outline: `2px solid ${isSel ? '#D4AF37' : isHov ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.55)'}`,
                outlineOffset: isSel ? 2 : 1,
                backgroundColor: isHov ? 'rgba(201,176,87,0.08)' : 'transparent',
              }}
            >
              <span
                className={`absolute rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] shadow-sm whitespace-nowrap ${
                  isSel ? 'bg-gold text-black' : 'bg-[#161616]/85 text-white/85'
                }`}
                style={{
                  left: 4,
                  top: chipTop - b.box.top,
                }}
              >
                {chip}
              </span>
            </div>
          </div>
        )
      })}

      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-[86]">
        <span className="rounded-full bg-[#161616]/70 px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm whitespace-nowrap">
          Select mode · hover the gold outline to find editable elements
        </span>
      </div>
    </div>
  )
}