'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
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

export function Lightbox({ open, images, initialIndex, onClose }: LightboxProps) {
  const items = useMemo(() => images.filter((image) => image.src), [images])
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => {
      setIndex(Math.min(initialIndex, Math.max(items.length - 1, 0)))
      setZoomed(false)
    })
  }, [initialIndex, items.length])

  const goPrev = useCallback(() => {
    setZoomed(false)
    setIndex((prev) => (prev - 1 < 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goNext = useCallback(() => {
    setZoomed(false)
    setIndex((prev) => (prev + 1 >= items.length ? 0 : prev + 1))
  }, [items.length])

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

  if (!open || items.length === 0) return null

  const current = items[index]

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
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <div className="rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
            {index + 1} / {items.length}
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <Icon name="x" size={20} />
        </button>

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
          className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden"
        >
          <Icon name="chevron-right" size={20} />
        </button>

        <button
          onClick={() => setZoomed((prev) => !prev)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <Icon name={zoomed ? 'zoom-out' : 'zoom-in'} size={20} />
        </button>

        <motion.img
          key={current.id}
          src={current.src}
          alt={current.alt}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: zoomed ? 1.6 : 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'max-h-[86vh] max-w-[92vw] select-none rounded-md object-contain',
            zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          )}
          onClick={() => setZoomed((prev) => !prev)}
          draggable={false}
        />

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 sm:hidden">
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
      </motion.div>
    </AnimatePresence>
  )
}