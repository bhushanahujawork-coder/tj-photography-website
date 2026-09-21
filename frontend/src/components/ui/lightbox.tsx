'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { PortfolioImage } from '@/types'

interface LightboxProps {
  open: boolean
  images: PortfolioImage[]
  initialIndex: number
  onClose: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function Lightbox({ open, images, initialIndex, onClose }: LightboxProps) {
  const items = useMemo(() => images.filter((image) => image.src), [images])
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null)
  const stripRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    Promise.resolve().then(() => {
      setIndex(Math.min(initialIndex, Math.max(items.length - 1, 0)))
      setZoom(MIN_ZOOM)
      setPan({ x: 0, y: 0 })
      setOrigin({ x: 50, y: 50 })
      setShareOpen(false)
      setCopied(false)
    })
  }, [initialIndex, items.length])

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM)
    setPan({ x: 0, y: 0 })
    setOrigin({ x: 50, y: 50 })
    setShareOpen(false)
    setCopied(false)
  }, [])

  const goTo = useCallback((i: number) => {
    resetView()
    setIndex(((i % items.length) + items.length) % items.length)
  }, [items.length, resetView])

  const goPrev = useCallback(() => {
    resetView()
    setIndex((prev) => (prev - 1 < 0 ? items.length - 1 : prev - 1))
  }, [items.length, resetView])

  const goNext = useCallback(() => {
    resetView()
    setIndex((prev) => (prev + 1 >= items.length ? 0 : prev + 1))
  }, [items.length, resetView])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    },
    [open, onClose, goPrev, goNext]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    stripRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [index])

  if (!open || items.length === 0) return null

  const current = items[index]
  const imgUrl = current.src.startsWith('http')
    ? current.src
    : typeof window !== 'undefined' ? `${window.location.origin}${current.src}` : current.src
  const shareText = `TJ Photography — ${current.alt}`

  const handleWheel = (e: React.WheelEvent) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + (e.deltaY < 0 ? 0.25 : -0.25)))
    if (next === MIN_ZOOM) setPan({ x: 0, y: 0 })
    setZoom(next)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= MIN_ZOOM) return
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false }
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true
    setPan({ x: d.panX + dx, y: d.panY + dy })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!d) return
    if (!d.moved) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      if (zoom > MIN_ZOOM) {
        setZoom(MIN_ZOOM)
        setPan({ x: 0, y: 0 })
      } else {
        setOrigin({ x, y })
        setZoom(2.2)
      }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(imgUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  const handleNativeShare = async () => {
    try {
      const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> }
      if (nav.share) await nav.share({ title: 'TJ Photography', text: shareText, url: imgUrl })
    } catch { }
  }

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-lg"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Top bar: counter + share + close */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <div className="rounded-lg bg-black/60 px-3 py-1.5 text-sm text-gold backdrop-blur-sm border border-gold/20">
            {index + 1} / {items.length}
          </div>
        </div>

        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setShareOpen((v) => !v); setCopied(false) }}
              aria-label="Share photo"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors border',
                shareOpen
                  ? 'bg-gold text-black border-gold'
                  : 'bg-black/60 text-white border-gold/20 hover:bg-white/20',
              )}
            >
              <Icon name="share" size={18} />
            </button>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-gold/25 bg-[#111]/95 backdrop-blur-md shadow-2xl shadow-black/60"
              >
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.25em] text-gold/80">
                  Share this photo
                </p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${imgUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <Icon name="message" size={16} className="text-gold" />
                  WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(imgUrl)}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <Icon name="mail" size={16} className="text-gold" />
                  Email
                </a>
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <Icon name={copied ? 'check' : 'link'} size={16} className="text-gold" />
                  {copied ? 'Link copied!' : 'Copy link'}
                </button>
                {canNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                  >
                    <Icon name="images" size={16} className="text-gold" />
                    More options…
                  </button>
                )}
                <div className="h-2" />
              </motion.div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-gold/20 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <button
          onClick={goPrev}
          aria-label="Previous image"
          className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden"
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <button
          onClick={goNext}
          aria-label="Next image"
          className="absolute right-3 lg:right-24 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden"
        >
          <Icon name="chevron-right" size={20} />
        </button>

        {/* Main image */}
        <div className="flex h-full w-full items-center justify-center overflow-hidden px-2 pb-24 pt-16 sm:pb-6 lg:pr-24 lg:pl-14">
          <motion.img
            key={current.id}
            src={current.src}
            alt={current.alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: dragging ? 'none' : 'transform 0.25s ease-out',
            }}
            className="max-h-full max-w-full select-none rounded-md object-contain touch-none"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            draggable={false}
          />
        </div>

        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] tracking-wide text-white/70 backdrop-blur-sm sm:hidden">
          {zoom > MIN_ZOOM ? 'Drag to explore • tap to reset' : 'Tap photo to zoom'}
        </div>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:hidden">
          <button
            onClick={goPrev}
            aria-label="Previous image"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next image"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>

        {/* Filmstrip: side on desktop, bottom on mobile */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-gold/15 bg-black/70 backdrop-blur-md lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-20 lg:border-l lg:border-t-0">
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2 lg:h-full lg:flex-col lg:items-center lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:py-3">
            {items.map((img, i) => (
              <button
                key={img.id}
                ref={(el) => { stripRefs.current[i] = el }}
                onClick={() => goTo(i)}
                aria-label={`View ${img.alt}`}
                className={cn(
                  'relative h-14 w-14 shrink-0 overflow-hidden rounded-md transition-all duration-200',
                  i === index
                    ? 'ring-2 ring-gold ring-offset-2 ring-offset-black'
                    : 'opacity-50 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.gridSrc ?? img.src}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
