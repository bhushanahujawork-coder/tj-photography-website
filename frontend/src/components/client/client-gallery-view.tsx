'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, apiFetchBlob, mediaUrl, type ApiError } from '@/lib/api'

interface ClientPhoto {
  id: string
  alt: string
  width: number
  height: number
  favorite: boolean
  isHighlight: boolean
  createdAt: string
  exif?: { camera?: string }
  mediumPath: string
  thumbnailPath: string
  originalPath: string
}

interface BackendPhoto {
  id: string
  filename?: string | null
  altText?: string | null
  width?: number | null
  height?: number | null
  favorite?: boolean
  isHighlight?: boolean
  createdAt?: string
  camera?: string | null
  originalUrl?: string | null
  mediumUrl?: string | null
  thumbnailUrl?: string | null
}

interface WeddingInfo {
  id: string
  weddingName: string
  brideName: string
  groomName: string
  weddingDate: string
  location: string
  weddingCode: string
}

interface ShareGalleryInfo {
  wedding: WeddingInfo
  share: {
    code: string
    role: string
    downloadEnabled: boolean
  }
  downloadAllowed: boolean
}

interface PaginatedPhotos<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

const authedBlobCache = new Map<string, string>()

function useAuthedMedia(path: string | null | undefined, enabled: boolean): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!enabled || !path) return null
    return authedBlobCache.get(path) ?? null
  })

  useEffect(() => {
    if (!enabled || !path || authedBlobCache.has(path)) return
    let cancelled = false
    apiFetchBlob(path)
      .then((blob) => {
        if (cancelled) return
        const objectUrl = URL.createObjectURL(blob)
        authedBlobCache.set(path, objectUrl)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => { cancelled = true }
  }, [enabled, path])

  return url
}

function GalleryMedia({
  publicMode,
  path,
  alt,
  className,
}: {
  publicMode: boolean
  path: string
  alt: string
  className?: string
}) {
  const authedUrl = useAuthedMedia(path, !publicMode)
  const src = publicMode ? mediaUrl(path) : authedUrl

  if (!path || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-[#1f1f1f] via-[#2a2015] to-[#161616]',
          className,
        )}
      >
        <Icon name="image" size={26} className="text-white/15" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  )
}

function mapClientPhoto(p: BackendPhoto): ClientPhoto {
  return {
    id: p.id,
    alt: p.altText || p.filename || 'Wedding photo',
    width: p.width || 800,
    height: p.height || 600,
    favorite: !!p.favorite,
    isHighlight: !!p.isHighlight,
    createdAt: p.createdAt || new Date().toISOString(),
    exif: p.camera ? { camera: p.camera } : undefined,
    mediumPath: p.mediumUrl || p.originalUrl || '',
    thumbnailPath: p.thumbnailUrl || p.mediumUrl || '',
    originalPath: p.originalUrl || p.mediumUrl || '',
  }
}

async function saveBlobAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const PHOTOS_PER_LOAD = 30

export function ClientGalleryView({ shareCode, weddingCode }: { shareCode?: string; weddingCode?: string }) {
  const { toast } = useToast()
  const isShare = !!shareCode

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wedding, setWedding] = useState<WeddingInfo | null>(null)
  const [share, setShare] = useState<{
    code: string
    role: string
    downloadEnabled: boolean
    downloadAllowed: boolean
  } | null>(null)
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [displayCount, setDisplayCount] = useState(PHOTOS_PER_LOAD)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (shareCode) {
          const gallery = await apiFetch<ShareGalleryInfo>(`/api/v1/share/${shareCode}`)
          if (cancelled) return
          setWedding(gallery.wedding)
          setShare({
            code: gallery.share.code,
            role: gallery.share.role,
            downloadEnabled: !!gallery.share.downloadEnabled,
            downloadAllowed: !!gallery.downloadAllowed,
          })

          const listing = await apiFetch<PaginatedPhotos<BackendPhoto>>(
            `/api/v1/share/${shareCode}/photos?page_size=200`,
          )
          if (cancelled) return
          setPhotos((listing.items || []).map(mapClientPhoto))
        } else if (weddingCode) {
          const w = await apiFetch<WeddingInfo>(`/api/v1/weddings/by-code/${weddingCode}`)
          if (cancelled) return
          setWedding(w)
          setShare(null)

          const listing = await apiFetch<PaginatedPhotos<BackendPhoto>>(
            `/api/v1/weddings/${w.id}/photos?page_size=200`,
          )
          if (cancelled) return
          setPhotos((listing.items || []).map(mapClientPhoto))
        }
      } catch (e) {
        if (cancelled) return
        const status = (e as ApiError)?.status
        if (status === 404) setError('not-found')
        else if (status === 401 || status === 403) setError('private')
        else setError('error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shareCode, weddingCode, reloadKey])

  useEffect(() => {
    if (!sentinelRef.current || photos.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < photos.length) {
          setDisplayCount((prev) => prev + PHOTOS_PER_LOAD)
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [photos.length, displayCount])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % photos.length))
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? prev : (prev - 1 + photos.length) % photos.length,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const visiblePhotos = useMemo(() => photos.slice(0, displayCount), [photos, displayCount])

  const handleToggleFavorite = (photoId: string) => {
    if (isShare) return
    apiFetch<BackendPhoto>(`/api/v1/photos/${photoId}/favorite`, { method: 'PUT' })
      .then((updated) => {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, favorite: !!updated.favorite } : p)),
        )
      })
      .catch(() => {
        toast({ title: 'Could not update favorite', variant: 'error' })
      })
  }

  const handleDownloadPhoto = (photoId: string) => {
    if (isShare) return
    const photo = photos.find((p) => p.id === photoId)
    apiFetchBlob(`/api/v1/photos/${photoId}/download`)
      .then((blob) => {
        const name = (photo?.alt || 'photo').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
        saveBlobAs(blob, `${name || 'photo'}.png`)
      })
      .catch(() => {
        toast({ title: 'Download not permitted for this gallery', variant: 'error' })
      })
  }

  const handleDownloadAll = () => {
    if (isShare || photos.length === 0) return
    const ids = photos.map((p) => p.id).join(',')
    toast({ title: 'Preparing ZIP download...', variant: 'success' })
    apiFetchBlob(`/api/v1/photos/download?photo_ids=${ids}`)
      .then((blob) => {
        const base = (wedding?.weddingName || 'gallery').replace(/\s+/g, '-').toLowerCase()
        saveBlobAs(blob, `${base}-photos.zip`)
      })
      .catch(() => {
        toast({ title: 'Download not permitted for this gallery', variant: 'error' })
      })
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-10 w-10 animate-pulse-soft rounded-xl bg-gold/30" />
          <p className="text-sm text-muted">Loading your gallery…</p>
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Icon
                name={error === 'error' ? 'alert-circle' : 'lock'}
                size={30}
                className="text-gold/70"
              />
            </div>
            <h1 className="font-serif text-2xl text-foreground">
              {error === 'not-found'
                ? (isShare ? 'This gallery link is invalid or expired' : 'Wedding not found')
                : error === 'private'
                  ? 'This gallery is private'
                  : 'Unable to load this gallery'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {error === 'not-found'
                ? (isShare
                    ? 'The link you opened is no longer active. Please use the link TJ Photography shared with you.'
                    : 'No wedding matches this code. Please check the code and try again.')
                : error === 'private'
                  ? 'Photographer access only. Open the share link TJ Photography sent you, or sign in to your account to view this wedding.'
                  : 'Please try again in a moment. If the problem continues, your photographer can help.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button variant="secondary">
                  <Icon name="globe" size={16} />
                  Home
                </Button>
              </Link>
              <Button onClick={() => { setError(null); setLoading(true); setReloadKey((k) => k + 1) }}>
                <Icon name="refresh" size={16} />
                Try again
              </Button>
            </div>
          </motion.div>
        </div>
      </Shell>
    )
  }

  const code = wedding?.weddingCode || share?.code || ''
  const galleryEmpty = photos.length === 0
  const canFavorite = !isShare
  const canDownload = !isShare
  const hdAllowed = isShare ? (share?.downloadAllowed ?? false) && (share?.downloadEnabled ?? false) : true

  return (
    <Shell>
      <div className="relative min-h-dvh">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10)_0%,transparent_65%)]" />

        <header className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-serif text-sm font-bold text-black">
                TJ
              </div>
              <span className="font-serif text-base text-foreground">TJ Photography</span>
            </Link>
            {code && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-medium tracking-wide text-gold">
                <Icon name="lock" size={11} />
                {code}
              </span>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mt-16 text-center sm:mt-20"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
              {isShare ? 'A TJ Photography Gallery' : 'Your Wedding Gallery'}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              {wedding?.brideName && wedding?.groomName
                ? `${wedding.brideName} & ${wedding.groomName}`
                : wedding?.weddingName || 'Wedding Gallery'}
            </h1>
            {wedding?.weddingName && wedding.brideName && (
              <p className="mt-2 text-sm tracking-wide text-muted">{wedding.weddingName}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
              {wedding?.weddingDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={13} />
                  {new Date(wedding.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {wedding?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="globe" size={13} />
                  {wedding.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon name="images" size={13} />
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {canDownload && (
                <Button onClick={handleDownloadAll} variant="secondary" size="sm" disabled={galleryEmpty}>
                  <Icon name="download" size={15} />
                  Download All
                </Button>
              )}
              {hdAllowed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-muted">
                  <Icon name="download" size={12} className="text-gold" />
                  HD originals enabled
                </span>
              )}
            </div>
          </motion.div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-6">
          {galleryEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Icon name="images" size={28} className="text-muted" />
              </div>
              <h2 className="font-serif text-xl text-foreground">No photos yet</h2>
              <p className="mt-1 text-sm text-muted">
                {isShare
                    ? 'TJ will upload your wedding moments here. Check back soon.'
                    : 'This wedding has no photos uploaded yet. Check back soon.'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {visiblePhotos.map((photo, index) => (
                  <motion.button
                    key={photo.id}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative mb-4 block w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/5 bg-card text-left"
                    style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                  >
                    <GalleryMedia
                      publicMode={isShare}
                      path={photo.thumbnailPath}
                      alt={photo.alt}
                      className="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="truncate text-xs text-white/85">{photo.alt}</span>
                      {photo.favorite && (
                        <Icon name="heart" size={14} className="shrink-0 fill-red-400 text-red-400" />
                      )}
                    </div>
                    {photo.isHighlight && !photo.favorite && (
                      <span className="pointer-events-none absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 backdrop-blur-sm">
                        <Icon name="star" size={12} className="text-gold" />
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              <div ref={sentinelRef} className="flex items-center justify-center pt-4">
                {displayCount < photos.length ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                ) : (
                  <p className="text-xs text-muted/60">
                    All {photos.length} photo{photos.length !== 1 ? 's' : ''} loaded
                  </p>
                )}
              </div>
            </>
          )}
        </main>

        <footer className="relative z-10 border-t border-white/5 py-8">
          <p className="text-center text-xs tracking-wide text-muted/70">
            Captured & curated by <span className="text-gold">TJ Photography</span> · Jamnagar
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <GalleryLightbox
            key={`lb-${lightboxIndex}`}
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
            isShare={isShare}
            canFavorite={canFavorite}
            canDownload={canDownload}
            hdAllowed={hdAllowed}
            onFavorite={handleToggleFavorite}
            onDownload={handleDownloadPhoto}
          />
        )}
      </AnimatePresence>
    </Shell>
  )
}

function GalleryLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  isShare,
  canFavorite,
  canDownload,
  hdAllowed,
  onFavorite,
  onDownload,
}: {
  photos: ClientPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
  isShare: boolean
  canFavorite: boolean
  canDownload: boolean
  hdAllowed: boolean
  onFavorite: (photoId: string) => void
  onDownload: (photoId: string) => void
}) {
  const photo = photos[index]
  const [hd, setHd] = useState(false)
  const [zoom, setZoom] = useState(1)

  const goPrev = () => onIndexChange((index - 1 + photos.length) % photos.length)
  const goNext = () => onIndexChange((index + 1) % photos.length)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm">
          {index + 1} / {photos.length}
        </span>
        {hdAllowed && (
          <button
            type="button"
            onClick={() => setHd((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm transition-colors',
              hd ? 'bg-gold text-black' : 'bg-white/5 text-white/80 hover:bg-white/10',
            )}
            title="Toggle full-resolution view"
          >
            <Icon name="zoom-in" size={13} />
            HD
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous photo"
        className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15 max-lg:bottom-24 max-lg:left-auto max-lg:right-20"
      >
        <Icon name="chevron-left" size={22} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next photo"
        className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15 max-lg:bottom-24 max-lg:right-8"
      >
        <Icon name="chevron-right" size={22} />
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15"
      >
        <Icon name="x" size={20} />
      </button>

      <div
        className="z-0 flex max-h-[82vh] max-w-[88vw] cursor-zoom-in items-center justify-center"
        onClick={() => setZoom((z) => (z === 1 ? 1.5 : 1))}
        title={zoom === 1 ? 'Zoom in' : 'Zoom out'}
      >
        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <GalleryMedia
            publicMode={isShare}
            path={hd ? photo.originalPath : photo.mediumPath}
            alt={photo.alt}
            className="max-h-[82vh] max-w-[88vw] rounded-lg object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-t from-black/85 to-transparent px-6 pb-5 pt-10">
        <div className="min-w-0">
          <p className="truncate text-sm text-white/90">{photo.alt}</p>
          <p className="mt-0.5 text-xs text-white/55">
            {photo.width} × {photo.height}
            {photo.exif?.camera ? ` · ${photo.exif.camera}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canFavorite && (
            <button
              type="button"
              onClick={() => onFavorite(photo.id)}
              title={photo.favorite ? 'Remove favorite' : 'Add favorite'}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-105',
                photo.favorite ? 'bg-red-500/25 text-red-400' : 'bg-white/10 text-white/85 hover:bg-white/20',
              )}
            >
              <Icon
                name="heart"
                size={18}
                className={photo.favorite ? 'fill-red-400' : ''}
              />
            </button>
          )}
          {canDownload && (
            <button
              type="button"
              onClick={() => onDownload(photo.id)}
              title="Download (PNG)"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black backdrop-blur-sm transition-all hover:scale-105"
            >
              <Icon name="download" size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            title="Next photo"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 max-lg:hidden"
          >
            <Icon name="play" size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {children}
      <Toaster />
    </div>
  )
}