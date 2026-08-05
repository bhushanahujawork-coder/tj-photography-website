'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Photo } from '@/types/platform'

interface PhotoDetailModalProps {
  open: boolean
  onClose: () => void
  photos: Photo[]
  initialIndex: number
  onIndexChange?: (index: number) => void
  onFavorite?: (photoId: string) => void
  onDownload?: (photoId: string) => void
}

export function PhotoDetailModal({
  open,
  onClose,
  photos,
  initialIndex,
  onIndexChange,
  onFavorite,
  onDownload,
}: PhotoDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [slideshowActive, setSlideshowActive] = useState(false)
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentPhoto = photos[currentIndex]

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoomLevel(1)
    setSlideshowActive(false)
  }, [initialIndex, open])

  useEffect(() => {
    if (slideshowActive) {
      slideshowRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next >= photos.length) {
            setSlideshowActive(false)
            return 0
          }
          return next
        })
        setZoomLevel(1)
      }, 3000)
    }
    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current)
    }
  }, [slideshowActive, photos.length])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goPrev()
          break
        case 'ArrowRight':
          goNext()
          break
      }
    },
    [open, currentIndex, photos.length]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function goPrev() {
    setZoomLevel(1)
    setCurrentIndex((prev) => {
      const next = prev - 1
      if (next < 0) return photos.length - 1
      return next
    })
    onIndexChange?.(currentIndex - 1 < 0 ? photos.length - 1 : currentIndex - 1)
  }

  function goNext() {
    setZoomLevel(1)
    setCurrentIndex((prev) => {
      const next = prev + 1
      if (next >= photos.length) return 0
      return next
    })
    onIndexChange?.(currentIndex + 1 >= photos.length ? 0 : currentIndex + 1)
  }

  function toggleZoom() {
    setZoomLevel((prev) => (prev === 1 ? 2 : 1))
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  function toggleSlideshow() {
    setSlideshowActive((prev) => !prev)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-lg lg:flex-row"
          onClick={handleOverlayClick}
        >
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
              <div className="rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                {currentIndex + 1} / {photos.length}
              </div>
            </div>

            <button
              onClick={goPrev}
              className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 max-lg:hidden"
            >
              <Icon name="chevron-left" size={20} />
            </button>

            <button
              onClick={goNext}
              className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 max-lg:hidden"
            >
              <Icon name="chevron-right" size={20} />
            </button>

            <div className="flex items-center justify-center p-4">
              {currentPhoto ? (
                <div
                  className="cursor-pointer transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onClick={toggleZoom}
                >
                  {currentPhoto.src ? (
                    <img
                      src={currentPhoto.src}
                      alt={currentPhoto.alt}
                      className="max-h-[80vh] max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]"
                      style={{
                        width: Math.min(currentPhoto.width, 600),
                        height: Math.min(currentPhoto.height, 600),
                      }}
                    >
                      <Icon name="image" size={48} className="text-gold/30" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]">
                  <Icon name="image" size={48} className="text-gold/30" />
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 lg:hidden">
              <button
                onClick={goPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Icon name="chevron-left" size={20} />
              </button>
              <button
                onClick={goNext}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Icon name="chevron-right" size={20} />
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col border-t border-white/10 bg-black/80 backdrop-blur-sm lg:w-80 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleZoom}
                  title={zoomLevel === 1 ? 'Zoom in' : 'Zoom out'}
                >
                  <Icon name={zoomLevel === 1 ? 'zoom-in' : 'zoom-out'} size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  <Icon name={isFullscreen ? 'minimize' : 'fullscreen'} size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSlideshow}
                  title={slideshowActive ? 'Pause slideshow' : 'Start slideshow'}
                >
                  <Icon name={slideshowActive ? 'pause' : 'play'} size={16} />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} title="Close">
                <Icon name="x" size={18} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {currentPhoto && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-base text-foreground">Photo Information</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">File</span>
                        <span className="text-foreground">{currentPhoto.alt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Dimensions</span>
                        <span className="text-foreground">
                          {currentPhoto.width} x {currentPhoto.height}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Date Taken</span>
                        <span className="text-foreground">
                          {currentPhoto.exif?.dateTaken
                            ? formatDate(currentPhoto.exif.dateTaken, 'long')
                            : formatDate(currentPhoto.createdAt, 'long')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentPhoto.exif && (
                    <div>
                      <h3 className="font-serif text-base text-foreground">Camera Info</h3>
                      <div className="mt-3 space-y-2 text-sm">
                        {currentPhoto.exif.camera && (
                          <div className="flex justify-between">
                            <span className="text-muted">Camera</span>
                            <span className="text-foreground">{currentPhoto.exif.camera}</span>
                          </div>
                        )}
                        {currentPhoto.exif.lens && (
                          <div className="flex justify-between">
                            <span className="text-muted">Lens</span>
                            <span className="text-foreground">{currentPhoto.exif.lens}</span>
                          </div>
                        )}
                        {currentPhoto.exif.aperture && (
                          <div className="flex justify-between">
                            <span className="text-muted">Aperture</span>
                            <span className="text-foreground">{currentPhoto.exif.aperture}</span>
                          </div>
                        )}
                        {currentPhoto.exif.shutterSpeed && (
                          <div className="flex justify-between">
                            <span className="text-muted">Shutter</span>
                            <span className="text-foreground">{currentPhoto.exif.shutterSpeed}</span>
                          </div>
                        )}
                        {currentPhoto.exif.iso && (
                          <div className="flex justify-between">
                            <span className="text-muted">ISO</span>
                            <span className="text-foreground">{currentPhoto.exif.iso}</span>
                          </div>
                        )}
                        {currentPhoto.exif.focalLength && (
                          <div className="flex justify-between">
                            <span className="text-muted">Focal Length</span>
                            <span className="text-foreground">{currentPhoto.exif.focalLength}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-serif text-base text-foreground">Actions</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload?.(currentPhoto.id)}
                      >
                        <Icon name="download" size={14} />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFavorite?.(currentPhoto.id)}
                        className={currentPhoto.favorite ? 'text-red-400' : ''}
                      >
                        <Icon
                          name="heart"
                          size={14}
                          className={currentPhoto.favorite ? 'fill-red-400 text-red-400' : ''}
                        />
                        {currentPhoto.favorite ? 'Favorited' : 'Favorite'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Icon name="share" size={14} />
                        Share
                      </Button>
                    </div>
                  </div>

                  {currentPhoto.isHighlight && (
                    <Badge variant="info" className="w-fit">
                      <Icon name="star" size={12} className="mr-1" />
                      Highlight
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
