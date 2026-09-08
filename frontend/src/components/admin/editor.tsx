'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HomeConfig, SectionId, WidthClass } from '@/lib/home-config/types'
import {
  createInitialConfig,
  mergeConfig,
  readLogoValue,
  readNavOffset,
  setLogoValue,
  setNavOffset,
  widthClassOf,
} from '@/lib/home-config/shared'
import { getDeep, setDeep, type Path } from './utils'
import {
  sendToFrame,
  parsePreviewMessage,
  TJ_PREVIEW_BRIDGE,
  type EditorMode,
  type ElementKey,
  type RectPayload,
  type DragElement,
} from '@/lib/home-config/preview-bridge'
import {
  HeaderPanel,
  SoulCinemaPanel,
  ReviewsPanel,
  ContactPanel,
  FooterPanel,
  GlobalPanel,
  SectionOrderPanel,
  type PanelProps,
} from './panels'
import { FilmContextCard } from './film-context-editor'
import { FilmStylePopover } from './film-style-popover'
import { BackgroundNoisePopover } from './background-noise-popover'
import { CanvasInfoPanel, HeroSectionEditor, PortfolioSectionEditor } from './media-context-editors'

type SectionKey = 'header' | 'hero' | 'soulCinema' | 'portfolio' | 'reviews' | 'contact' | 'footer' | 'films' | 'global' | 'sectionOrder'

/** Sections edited canvas-first (click in the preview → contextual editor). */
type CanvasSection = 'hero' | 'portfolio'

interface SectionDef {
  key: SectionKey
  label: string
  section: SectionId | null
}

const SECTIONS: SectionDef[] = [
  { key: 'header', label: 'Header', section: 'header' },
  { key: 'hero', label: 'Hero', section: 'hero' },
  { key: 'soulCinema', label: 'Soul Cinema', section: 'soulCinema' },
  { key: 'portfolio', label: 'Portfolio', section: 'portfolio' },
  { key: 'reviews', label: 'Reviews', section: 'reviews' },
  { key: 'contact', label: 'Contact', section: 'contact' },
  { key: 'footer', label: 'Footer', section: 'footer' },
]

const SITE_LEVEL: SectionDef[] = [
  { key: 'global', label: 'Global', section: null },
  { key: 'sectionOrder', label: 'Section Order', section: null },
]

/** Separate pages editable from the same editor (each has its own preview route). */
const PAGES: SectionDef[] = [{ key: 'films', label: 'Films Page', section: null }]

const PREVIEW_ROUTES: Record<string, string> = {
  home: '/admin/preview?embed=1',
  films: '/admin/preview-films?embed=1',
}

/**
 * Viewport presets — these only simulate a screen width for the preview.
 * They never pick which config is edited: there is ONE global config.
 */
const WIDTH_CLASS_LABEL: Record<WidthClass, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
}

/** Canonical width a device group jumps to. */
const CLASS_DEFAULT_WIDTH: Record<WidthClass, number> = {
  mobile: 390,
  tablet: 834,
  desktop: 1440,
}

const MAX_HISTORY = 50

const ELEMENT_PANELS: Record<ElementKey, { section: SectionKey; focus: string }> = {
  logo: { section: 'header', focus: 'header-logo' },
  nav: { section: 'header', focus: 'header-nav' },
  hero: { section: 'hero', focus: 'hero-images' },
  soulCinema: { section: 'soulCinema', focus: 'soulCinema-media' },
  portfolio: { section: 'portfolio', focus: 'portfolio-visual' },
  reviews: { section: 'reviews', focus: 'reviews-heading' },
  contact: { section: 'contact', focus: 'contact-heading' },
  footer: { section: 'footer', focus: 'footer-brand' },
}

interface DragState {
  element: DragElement
  header: RectPayload
  box: RectPayload
  other: RectPayload | null
  startX: number
  startY: number
  startOffsetX: number
}

function clampLayout(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

async function jsonFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

function HowToEdit() {
  return (
    <div className="mt-3 rounded-lg border border-gold/30 bg-gold/[0.06] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold-dark">How to edit</p>
      <ol className="mt-1.5 flex list-decimal list-inside flex-col gap-0.5 text-[10px] leading-relaxed text-foreground/75">
        <li>Select an element in the preview</li>
        <li>Drag it to reposition</li>
        <li>Fine-tune position and size here</li>
        <li>Save Draft to keep your changes</li>
        <li>Publish when ready</li>
      </ol>
    </div>
  )
}

export default function AdminEditor() {
  const router = useRouter()
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const readyRef = useRef(false)
  const savedDraftRef = useRef('')
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configRef = useRef<HomeConfig>(createInitialConfig())
  const modeRef = useRef<EditorMode>('select')
  const dragRef = useRef<DragState | null>(null)
  const undoStack = useRef<HomeConfig[]>([])
  const redoStack = useRef<HomeConfig[]>([])
  const activeRef = useRef<SectionKey>('header')
  const filmSelectionRef = useRef<{ id: string; rect: RectPayload | null } | null>(null)

  const [config, setConfig] = useState<HomeConfig>(() => createInitialConfig())
  const [active, setActive] = useState<SectionKey>('header')
  const [frameSrc, setFrameSrc] = useState(PREVIEW_ROUTES.home)
  const [width, setWidth] = useState(CLASS_DEFAULT_WIDTH.desktop)
  const widthClass = widthClassOf(width)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState('')
  const [mode, setMode] = useState<EditorMode>('select')
  const [focusTarget, setFocusTarget] = useState<string | null>(null)
  const [confirmingPublish, setConfirmingPublish] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  /* Films canvas-first editing (ID-based selection keeps working across reorders). */
  const [filmSelection, setFilmSelection] = useState<{ id: string; rect: RectPayload | null } | null>(null)
  const [cardAnchor, setCardAnchor] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const [styleOpen, setStyleOpen] = useState(false)
  const [bgOpen, setBgOpen] = useState(false)

  /* Hero + Portfolio are canvas-first too: the right side only shows info,
     editing happens in a contextual popover anchored to the clicked section. */
  const [sectionSel, setSectionSel] = useState<CanvasSection | null>(null)
  const [sectionAnchor, setSectionAnchor] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  const widthRef = useRef<number>(width)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3000)
  }, [])

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    widthRef.current = width
  }, [width])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    filmSelectionRef.current = filmSelection
  }, [filmSelection])

  const setViewport = useCallback((wc: WidthClass) => {
    setWidth(CLASS_DEFAULT_WIDTH[wc])
  }, [])

  /* ---- Undo / redo (immutable snapshots, capped). Drag is intentionally excluded. ---- */
  const snapshotConfig = (c: HomeConfig): HomeConfig => JSON.parse(JSON.stringify(c))

  const syncHistoryButtons = useCallback(() => {
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }, [])

  const pushUndo = useCallback((prev: HomeConfig) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_HISTORY - 1)), prev]
    redoStack.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current = [...redoStack.current, snapshotConfig(configRef.current)]
    configRef.current = prev
    setConfig(prev)
    setDirty(true)
    syncHistoryButtons()
  }, [syncHistoryButtons])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current = [...undoStack.current, snapshotConfig(configRef.current)]
    configRef.current = next
    setConfig(next)
    setDirty(true)
    syncHistoryButtons()
  }, [syncHistoryButtons])

  const clearHistory = useCallback(() => {
    undoStack.current = []
    redoStack.current = []
    setCanUndo(false)
    setCanRedo(false)
  }, [])

  const set = useCallback(
    (path: Path, value: unknown) => {
      const start = configRef.current
      const next = setDeep(start, path, value)
      if (next === start) return
      pushUndo(snapshotConfig(start))
      configRef.current = next
      setConfig(next)
      setDirty(true)
    },
    [pushUndo]
  )

  const reset = useCallback(
    (path: Path) => {
      const start = configRef.current
      const next = setDeep(start, path, getDeep(createInitialConfig(), path))
      if (next === start) return
      pushUndo(snapshotConfig(start))
      configRef.current = next
      setConfig(next)
      setDirty(true)
    },
    [pushUndo]
  )

  const pushToFrame = useCallback((cfg: HomeConfig) => {
    if (!readyRef.current || !frameRef.current?.contentWindow) return
    sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'config', config: cfg })
  }, [])

  /* Keep a live config snapshot and push immediately during drag (no debounce). */
  const applyDrag = useCallback(
    (next: HomeConfig) => {
      configRef.current = next
      setConfig(next)
      setDirty(true)
      pushToFrame(next)
    },
    [pushToFrame]
  )

  /* ---- Films canvas-first selection (ID-based, survives reorders) ---- */

  const sendFilmHighlight = useCallback(
    (id: string | null) => {
      if (frameRef.current?.contentWindow) {
        sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'filmHighlight', id })
      }
    },
    []
  )

  const selectFilmCard = useCallback(
    (id: string, rect: RectPayload | null) => {
      setActive('films')
      setFilmSelection({ id, rect })
      setStyleOpen(false)
      sendFilmHighlight(id)
    },
    [sendFilmHighlight]
  )

  const addFilmCard = () => {
    setMode('select')
    if (frameRef.current?.contentWindow) {
      sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'setMode', mode: 'select' })
    }
    const id = `f${Date.now()}`
    set(['films', 'cards'], [...configRef.current.films.cards, { id, couple: 'New Couple', description: '', embedId: '' }])
    selectFilmCard(id, null)
  }

  const removeFilmCard = (id: string) => {
    const cards = configRef.current.films.cards
    const idx = cards.findIndex((c) => c.id === id)
    const remaining = cards.filter((c) => c.id !== id)
    set(['films', 'cards'], remaining)
    if (remaining.length === 0) {
      setFilmSelection({ id, rect: null })
      setStyleOpen(false)
      sendFilmHighlight(null)
      return
    }
    const next = remaining[Math.min(idx, remaining.length - 1)]
    selectFilmCard(next.id, null)
  }

  const moveFilmCard = (id: string, dir: 'up' | 'down') => {
    const cards = configRef.current.films.cards
    const idx = cards.findIndex((c) => c.id === id)
    if (idx < 0) return
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= cards.length) return
    const next = [...cards]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    set(['films', 'cards'], next)
    /* selection id unchanged — ring + popover follow the same card */
  }

  const clearFilmSelection = useCallback(() => {
    setFilmSelection(null)
    setCardAnchor(null)
    setStyleOpen(false)
    sendFilmHighlight(null)
  }, [sendFilmHighlight])

  /* ---- Hero / Portfolio canvas-first selection ---- */

  const openSectionEditor = useCallback((section: CanvasSection) => {
    setActive(section)
    setFocusTarget(null)
    setStyleOpen(false)
    setFilmSelection(null)
    setCardAnchor(null)
    if (frameRef.current?.contentWindow) {
      sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'filmHighlight', id: null })
    }
    setSectionSel(section)
    setSectionAnchor(null)
    const doc = frameRef.current?.contentDocument
    const el = doc?.querySelector(`[data-section="${section}"]`)
    const fr = frameRef.current?.getBoundingClientRect()
    const r = el?.getBoundingClientRect()
    if (doc && el && r && fr) {
      setSectionAnchor({
        left: fr.left + r.left * scale,
        top: fr.top + r.top * scale,
        width: r.width * scale,
        height: r.height * scale,
      })
    }
  }, [scale])

  const clearSectionEditor = useCallback(() => {
    setSectionSel(null)
    setSectionAnchor(null)
  }, [])

  /* Reposition the hero/portfolio popover while the section is selected. */
  useEffect(() => {
    if (!sectionSel) return
    const f = frameRef.current
    if (!f) return
    let raf = 0
    const update = () => {
      raf = 0
      const doc = f.contentDocument
      const el = doc?.querySelector(`[data-section="${sectionSel}"]`)
      const fr = f.getBoundingClientRect()
      const r = el?.getBoundingClientRect()
      if (!doc || !el || !r) {
        setSectionAnchor(null)
        return
      }
      setSectionAnchor({
        left: fr.left + r.left * scale,
        top: fr.top + r.top * scale,
        width: r.width * scale,
        height: r.height * scale,
      })
    }
    raf = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    const stage = stageRef.current
    stage?.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(f)
    document.fonts?.ready?.then(update).catch(() => {})
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      stage?.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [sectionSel, scale])

  /* Escape closes the contextual editor; clicking another card simply re-selects. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearFilmSelection()
        clearSectionEditor()
        setBgOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearFilmSelection, clearSectionEditor])

  /* Anchor the contextual editor next to the selected card in the scaled preview. */
  useEffect(() => {
    const sel = filmSelection
    if (!sel || !sel.rect) return
    const rect = sel.rect
    const f = frameRef.current
    if (!f) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = f.getBoundingClientRect()
      setCardAnchor({
        left: r.left + rect.left * scale,
        top: r.top + rect.top * scale,
        width: rect.width * scale,
        height: rect.height * scale,
      })
    }
    raf = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    const stage = stageRef.current
    stage?.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(f)
    document.fonts?.ready?.then(update).catch(() => {})
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      stage?.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [filmSelection, scale])

  /* Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo — not inside inputs. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  /* Auth check + load draft */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { res, data } = await jsonFetch('/api/admin/me')
      if (!res.ok || !data.authenticated) {
        router.replace('/admin/login')
        return
      }
      const { res: draftRes, data: draft } = await jsonFetch('/api/home-config?status=draft')
      const next = draftRes.ok && draft ? mergeConfig(createInitialConfig(), draft) : createInitialConfig()
      if (cancelled) return
      configRef.current = next
      setConfig(next)
      savedDraftRef.current = JSON.stringify(next)
      setDirty(false)
      setLoading(false)
      clearHistory()
    })()
    return () => {
      cancelled = true
    }
  }, [router, clearHistory])

  /* Scale the preview to fit the stage width */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const update = () => {
      const avail = stage.clientWidth - 32
      setScale(Math.min(1, avail / width))
    }
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(stage)
    return () => ro?.disconnect()
  }, [width])

  /* Live preview: push config changes (debounced) after iframe ready */
  useEffect(() => {
    if (loading) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => pushToFrame(config), 250)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [config, loading, pushToFrame])

  /* Push the current select/view mode into the preview */
  useEffect(() => {
    if (!readyRef.current || !frameRef.current?.contentWindow) return
    sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'setMode', mode })
  }, [mode])

  /* Bridge: iframe events (element selection + dragging) */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = parsePreviewMessage(e.data)
      if (!msg) return
      if (msg.type === 'ready') {
        readyRef.current = true
        pushToFrame(configRef.current)
        if (frameRef.current?.contentWindow) {
          sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'setMode', mode: modeRef.current })
          if (activeRef.current === 'films' && filmSelectionRef.current) {
            sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'filmHighlight', id: filmSelectionRef.current.id })
          }
        }
      } else if (msg.type === 'filmSelect') {
        setActive('films')
        setFilmSelection({ id: msg.id, rect: msg.rect })
        setStyleOpen(false)
        if (frameRef.current?.contentWindow) {
          sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'filmHighlight', id: msg.id })
        }
      } else if (msg.type === 'select') {
        const key = SECTIONS.find((s) => s.section === msg.section)?.key
        if (key) {
          setActive(key)
          setFocusTarget(null)
        }
      } else if (msg.type === 'element') {
        if (msg.element === 'hero' || msg.element === 'portfolio') {
          openSectionEditor(msg.element)
          return
        }
        const map = ELEMENT_PANELS[msg.element]
        if (map) {
          setActive(map.section)
          setFocusTarget(map.focus)
        }
      } else if (msg.type === 'dragstart') {
        const cfg = configRef.current
        const w = widthRef.current
        if (msg.element === 'logo') {
          dragRef.current = {
            element: 'logo',
            header: msg.header,
            box: msg.box,
            other: msg.other,
            startX: readLogoValue(cfg, w, 'x'),
            startY: readLogoValue(cfg, w, 'y'),
            startOffsetX: 0,
          }
        } else {
          dragRef.current = {
            element: 'nav',
            header: msg.header,
            box: msg.box,
            other: msg.other,
            startX: 0,
            startY: 0,
            startOffsetX: readNavOffset(cfg, w),
          }
        }
      } else if (msg.type === 'dragmove') {
        const g = dragRef.current
        if (!g || g.element !== msg.element) return
        const { header, box } = g
        const w = widthRef.current
        const margin = 6
        if (g.element === 'logo') {
          const x0 = box.left - header.left
          const y0 = box.top - header.top
          const half = (header.height - box.height) / 2
          let maxX = Math.max(margin, header.width - box.width - margin)
          if (g.other && g.other.width > 0) {
            const navLeft = g.other.left - header.left
            maxX = Math.min(maxX, Math.max(margin, navLeft - box.width - 36))
          }
          const left = clampLayout(x0 + msg.dx, margin, maxX)
          const top = clampLayout(y0 + msg.dy, margin, Math.max(margin, header.height - box.height - margin))
          let next = setLogoValue(configRef.current, w, 'x', Math.round(left))
          next = setLogoValue(next, w, 'y', clampLayout(Math.round(top - half), -80, 80))
          applyDrag(next)
        } else {
          const logoRight =
            g.other && g.other.width > 0 ? (g.other.left - header.left) + g.other.width : margin
          const maxRight = clampLayout(
            header.width - box.width - (logoRight + 36),
            0,
            Math.max(4, header.width - box.width - margin)
          )
          const offset = Math.round(clampLayout(g.startOffsetX - msg.dx, -24, maxRight))
          applyDrag(setNavOffset(configRef.current, w, clampLayout(offset, -800, 800)))
        }
      } else if (msg.type === 'dragend') {
        dragRef.current = null
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [applyDrag, pushToFrame, openSectionEditor])

  /* Scroll the settings panel when switching section / focusing an element */
  useEffect(() => {
    const box = settingsRef.current
    if (!box) return
    if (!focusTarget) {
      box.scrollTo({ top: 0 })
      return
    }
    const el = box.querySelector<HTMLElement>(`[data-focus-id="${focusTarget}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [active, focusTarget])

  /* Warn before refresh/close while there are unsaved changes */
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const saveDraft = async () => {
    setBusy(true)
    const { res, data } = await jsonFetch('/api/home-config/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setBusy(false)
    if (res.ok) {
      savedDraftRef.current = JSON.stringify(config)
      setDirty(false)
      showToast('Draft saved')
    } else {
      showToast(data?.error || 'Failed to save draft')
    }
  }

  const previewWebsite = async () => {
    await saveDraft()
    window.open('/admin/preview', '_blank', 'noopener')
  }

  const beginPublish = () => {
    if (busy) return
    setConfirmingPublish(true)
  }

  const confirmPublish = async () => {
    setConfirmingPublish(false)
    await publish()
  }

  const publish = async () => {
    setBusy(true)
    const { res, data } = await jsonFetch('/api/home-config/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setBusy(false)
    if (res.ok) {
      savedDraftRef.current = JSON.stringify(config)
      setDirty(false)
      showToast(
        data?.deleted?.length
          ? `Published · ${data.deleted.length} old file${data.deleted.length > 1 ? 's' : ''} removed`
          : 'Published'
      )
    } else {
      showToast(
        data?.missing?.length ? `Missing media: ${data.missing.join(', ')}` : data?.error || 'Publish failed'
      )
    }
  }

  const resetAll = async () => {
    setBusy(true)
    const { res } = await jsonFetch('/api/home-config/reset', { method: 'POST' })
    setBusy(false)
    if (res.ok) {
      const defaults = createInitialConfig()
      configRef.current = defaults
      setConfig(defaults)
      savedDraftRef.current = JSON.stringify(defaults)
      setDirty(false)
      clearHistory()
      clearFilmSelection()
      showToast('Homepage restored to original defaults')
    } else {
      showToast('Reset failed')
    }
  }

  const logout = async () => {
    if (dirty && !window.confirm('You have unsaved changes. Log out anyway?')) return
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const highlightSection = (key: SectionKey) => {
    setActive(key)
    setFocusTarget(null)
    clearSectionEditor()
    if (key !== 'films') {
      setFilmSelection(null)
      setCardAnchor(null)
      setStyleOpen(false)
      if (frameRef.current?.contentWindow) {
        sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'filmHighlight', id: null })
      }
    } else {
      setStyleOpen(false)
    }
    setFrameSrc(key === 'films' ? PREVIEW_ROUTES.films : PREVIEW_ROUTES.home)
    const def = SECTIONS.find((s) => s.key === key)
    if (def?.section && frameRef.current?.contentWindow) {
      sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'scrollTo', section: def.section })
      sendToFrame(frameRef.current.contentWindow, { bridge: TJ_PREVIEW_BRIDGE, type: 'highlight', section: def.section })
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  const panelProps: PanelProps & {
    focusTarget: string | null
    setFocus: (id: string | null) => void
  } = {
    config,
    set,
    reset,
    previewWidth: width,
    focusTarget,
    setFocus: (id: string | null) => setFocusTarget(id),
  }

  const activeLabel = [...SECTIONS, ...PAGES, ...SITE_LEVEL].find((s) => s.key === active)?.label ?? ''

  const selectedFilmCard = filmSelection?.id
    ? (config.films.cards.find((c) => c.id === filmSelection.id) ?? null)
    : null
  const hasRect = Boolean(filmSelection?.rect)

  const POP_W = 300
  const cardPopoverPos = (() => {
    if (!cardAnchor || typeof window === 'undefined') return null
    const aw = window.innerWidth
    const ah = window.innerHeight
    let left = cardAnchor.left + cardAnchor.width + 14
    if (left + POP_W > aw - 14) left = cardAnchor.left - POP_W - 14
    left = Math.max(14, Math.min(left, aw - POP_W - 14))
    const top = Math.max(14, Math.min(cardAnchor.top, ah - 470 - 14))
    return { left, top }
  })()

  const SECPOP_W = 340
  const sectionPopoverPos = (() => {
    if (!sectionAnchor || typeof window === 'undefined') return null
    const aw = window.innerWidth
    const ah = window.innerHeight
    let left = sectionAnchor.left + sectionAnchor.width + 12
    if (left + SECPOP_W > aw - 12) left = sectionAnchor.left - SECPOP_W - 12
    left = Math.max(12, Math.min(left, aw - SECPOP_W - 12))
    const top = Math.max(12, Math.min(sectionAnchor.top, ah - 700 - 12))
    return { left, top }
  })()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#161616] text-white">
        <div className="flex items-center justify-between gap-3 px-4 h-14 overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold tracking-[0.12em] uppercase whitespace-nowrap">
              TJ <span className="text-gold">Homepage Editor</span>
            </span>
            <span
              className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap ${
                dirty ? 'border-gold/70 text-gold' : 'border-emerald-400/40 text-emerald-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${dirty ? 'bg-gold animate-pulse' : 'bg-emerald-400'}`}
              />
              {dirty ? 'Unsaved changes' : '✓ Saved'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={undo}
              disabled={!canUndo || busy}
              title="Undo (Ctrl/Cmd+Z)"
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-white/25 text-white/80 hover:border-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-15-6.7L3 13" />
              </svg>
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo || busy}
              title="Redo (Ctrl/Cmd+Shift+Z)"
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-white/25 text-white/80 hover:border-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0115-6.7L21 13" />
              </svg>
              Redo
            </button>
            <button
              onClick={() => {
                setBgOpen((o) => !o)
                setStyleOpen(false)
              }}
              title="Background appearance — grain / noise"
              className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                bgOpen
                  ? 'border-gold bg-gold text-black font-semibold'
                  : 'border-white/25 text-white/80 hover:border-white/60'
              }`}
            >
              Background
            </button>
            <button
              onClick={saveDraft}
              disabled={busy}
              className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/25 text-white/80 hover:border-white/60 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Save Draft
            </button>
            <button
              onClick={previewWebsite}
              disabled={busy}
              className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/25 text-white/80 hover:border-white/60 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Preview
            </button>
            <button
              onClick={beginPublish}
              disabled={busy}
              className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-gold text-black font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Publish
            </button>
            <button
              onClick={resetAll}
              disabled={busy}
              className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg text-red-300 border border-red-400/30 hover:border-red-400/70 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Reset All
            </button>
            <button
              onClick={logout}
              className="ml-1 text-[11px] uppercase tracking-wider px-2 py-1.5 rounded-lg text-white/50 hover:text-white transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-56px)]">
        {/* Section nav */}
        <aside className="hidden md:flex w-48 shrink-0 flex-col border-r border-black/10 bg-white/50 overflow-y-auto">
          <div className="px-3 pt-4 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted">Sections</div>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => highlightSection(s.key)}
              className={`mx-2 my-0.5 text-left px-3 py-2 rounded-lg text-[12px] font-medium tracking-wide transition-colors ${
                active === s.key
                  ? 'bg-gold text-black'
                  : 'text-foreground/70 hover:bg-black/5'
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="px-3 pt-5 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted">Pages</div>
          {PAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => highlightSection(s.key)}
              className={`mx-2 my-0.5 text-left px-3 py-2 rounded-lg text-[12px] font-medium tracking-wide transition-colors ${
                active === s.key
                  ? 'bg-gold text-black'
                  : 'text-foreground/70 hover:bg-black/5'
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="px-3 pt-5 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted">Site</div>
          {SITE_LEVEL.map((s) => (
            <button
              key={s.key}
              onClick={() => highlightSection(s.key)}
              className={`mx-2 my-0.5 text-left px-3 py-2 rounded-lg text-[12px] font-medium tracking-wide transition-colors ${
                active === s.key
                  ? 'bg-gold text-black'
                  : 'text-foreground/70 hover:bg-black/5'
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="mt-6 px-5 pb-4 text-[10px] leading-relaxed text-muted">
            Editing only changes exposed values. Design, animations and effects stay untouched. Changes stay in the draft until Publish.
          </div>
        </aside>

        {/* Live preview stage */}
        <div ref={stageRef} className="flex-1 min-w-0 bg-[#181818] overflow-auto">
          <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-1.5 sticky top-0 z-10 bg-[#181818]">
            <div className="flex rounded-lg bg-black/40 ring-1 ring-white/10 p-0.5">
              {(['select', 'view'] as EditorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 text-[9px] uppercase tracking-wider rounded-md transition-colors ${
                    mode === m
                      ? 'bg-gold text-black font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {m === 'select' ? 'Select' : 'View Only'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['desktop', 'tablet', 'mobile'] as WidthClass[]).map((wc) => (
                <button
                  key={wc}
                  onClick={() => setViewport(wc)}
                  className={`px-2.5 py-1 text-[9px] uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                    widthClass === wc
                      ? 'bg-gold text-black font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {WIDTH_CLASS_LABEL[wc]}
                  {widthClass === wc ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-full flex items-start justify-center p-4 pt-3" style={{ minWidth: width * scale }}>
            <div style={{ width: width * scale, height: 'calc(100dvh - 56px - 52px)' }} className="relative">
              <div
                style={{
                  width: width,
                  height: 'calc(100dvh - 56px - 52px)',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-white"
              >
                <iframe
                  ref={frameRef}
                  src={frameSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Live editor preview (draft)"
                />
                <span className="pointer-events-none absolute top-2 left-3 z-[90] rounded-full bg-black/60 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
                  Draft · {WIDTH_CLASS_LABEL[widthClass]} viewport
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings panel (hidden for the Films page — it is canvas-first) */}
        {active !== 'films' && (
          <aside className="w-[340px] shrink-0 flex flex-col border-l border-black/10 bg-white/40 min-h-0">
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-black/10 bg-white/60">
              <h1 className="font-serif text-lg text-foreground">{activeLabel}</h1>
              <HowToEdit />
            </div>
            <div ref={settingsRef} className="flex-1 min-h-0 overflow-y-auto p-4">
              {active === 'header' && <HeaderPanel {...panelProps} />}
              {(active === 'hero' || active === 'portfolio') && (
                <CanvasInfoPanel kind={active} config={config} />
              )}
              {active === 'soulCinema' && <SoulCinemaPanel {...panelProps} />}
              {active === 'reviews' && <ReviewsPanel {...panelProps} />}
              {active === 'contact' && <ContactPanel {...panelProps} />}
              {active === 'footer' && <FooterPanel {...panelProps} />}
              {active === 'global' && <GlobalPanel {...panelProps} />}
              {active === 'sectionOrder' && <SectionOrderPanel {...panelProps} />}
            </div>
          </aside>
        )}
      </div>

      {active === 'films' && (
        <>
          {/* Floating canvas toolbar — no right-side panel on the Films page */}
          <div className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-3 py-2 shadow-2xl">
            <button
              onClick={addFilmCard}
              className="flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light transition-colors"
            >
              <span className="text-sm leading-none">+</span> Add film card
            </button>
            <span className="h-4 w-px bg-white/15" />
            <button
              onClick={() => setStyleOpen((o) => !o)}
              className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                styleOpen ? 'bg-gold text-black font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Film style
            </button>
            <span className="hidden md:inline text-[9px] uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
              click a card · click text to edit inline
            </span>
          </div>

          {/* Global style popover (opened only on demand) */}
          {styleOpen && (
            <div className="fixed right-4 z-[75]" style={{ top: 76 }}>
              <FilmStylePopover config={config} set={set} onClose={() => setStyleOpen(false)} />
            </div>
          )}

          {/* Contextual card editor, anchored next to the selected card */}
          {selectedFilmCard && (
            <div
              className="fixed z-[80]"
              style={
                hasRect && cardAnchor && cardPopoverPos
                  ? { left: cardPopoverPos.left, top: cardPopoverPos.top }
                  : { top: 120, right: 16 }
              }
            >
              <FilmContextCard
                key={selectedFilmCard.id}
                config={config}
                filmId={selectedFilmCard.id}
                set={set}
                onClose={clearFilmSelection}
                onRemove={removeFilmCard}
                onMove={moveFilmCard}
              />
            </div>
          )}
        </>
      )}

      {/* Background appearance — compact global control, no right-side panel needed */}
      {bgOpen && (
        <div className="fixed right-4 z-[75]" style={{ top: 76 }}>
          <BackgroundNoisePopover config={config} set={set} onClose={() => setBgOpen(false)} />
        </div>
      )}

      {/* Hero / Portfolio — contextual canvas-first editors, anchored to the section */}
      {sectionSel && (
        <div
          className="fixed z-[85]"
          style={
            sectionAnchor && sectionPopoverPos
              ? { left: sectionPopoverPos.left, top: sectionPopoverPos.top }
              : { top: 96, right: 16 }
          }
        >
          {sectionSel === 'hero' ? (
            <HeroSectionEditor config={config} set={set} onClose={clearSectionEditor} />
          ) : (
            <PortfolioSectionEditor config={config} set={set} onClose={clearSectionEditor} />
          )}
        </div>
      )}

      {confirmingPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-xl text-foreground">Publish to the live site?</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Publishing replaces the currently <strong>published</strong> homepage configuration with the
              current draft. All referenced media is validated first; uploaded files that are no longer
              referenced are removed.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Your working draft stays untouched until you confirm — and you can keep editing if anything
              looks wrong.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmingPublish(false)}
                disabled={busy}
                className="rounded-lg border border-black/10 px-4 py-2 text-[11px] uppercase tracking-wider text-muted hover:border-gold/40 hover:text-gold-dark transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={busy}
                className="rounded-lg bg-gold px-4 py-2 text-[11px] uppercase tracking-wider font-semibold text-black hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {busy ? 'Publishing…' : 'Publish now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#161616] text-white text-xs px-5 py-2.5 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}