'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, apiFetchBlob, mediaUrl, getGuestSession, setGuestSession, clearGuestSession, type ApiError } from '@/lib/api'
import ClientLoginModal from './client-login-modal'

interface ClientPhoto {
  id: string
  alt: string
  width: number
  height: number
  favorite: boolean
  reactedByMe: boolean
  isHighlight: boolean
  createdAt: string
  exif?: { camera?: string }
  mediumPath: string
  thumbnailPath: string
  originalPath: string
  albumId?: string | null
  downloadEnabled: boolean
}

interface BackendPhoto {
  id: string
  filename?: string | null
  altText?: string | null
  width?: number | null
  height?: number | null
  favorite?: boolean
  reactedByMe?: boolean
  isHighlight?: boolean
  createdAt?: string
  camera?: string | null
  originalUrl?: string | null
  mediumUrl?: string | null
  thumbnailUrl?: string | null
  albumId?: string | null
  downloadEnabled?: boolean
}

interface WeddingInfo {
  id: string
  weddingName: string
  brideName: string
  groomName: string
  weddingDate: string
  location: string
  weddingCode: string
  welcomeMessage?: string | null
  groupName?: string | null
  groupIconUrl?: string | null
  galleryDownloadEnabled?: boolean
}

interface ShareGalleryInfo {
  wedding: WeddingInfo
  share: {
    code: string
    role: string
    downloadEnabled: boolean
  }
  downloadAllowed: boolean
  livenessEnabled?: boolean
  welcomeMessage?: string | null
  groupName?: string | null
  groupIconUrl?: string | null
  hideDeleted?: boolean
  galleryDownloadEnabled?: boolean
}

interface PaginatedPhotos<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

const authedBlobCache = new Map<string, string>()

function useBlobMedia(
  path: string | null | undefined,
  grab: () => Promise<Blob>,
  enabled: boolean,
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !path) return
    let cancelled = false
    grab()
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
  }, [enabled, path, grab])

  return url
}

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

function usePinnedMedia(path: string | null | undefined, pin: string | null): string | null {
  const grab = useCallback(async () => {
    return apiFetchBlob(path || '', { 'X-Gallery-Pin': pin || '' })
  }, [path, pin])
  return useBlobMedia(path, grab, !!(path && pin))
}

function GalleryMedia({
  publicMode,
  pin,
  path,
  alt,
  className,
}: {
  publicMode: boolean
  pin?: string | null
  path: string
  alt: string
  className?: string
}) {
  const authedUrl = useAuthedMedia(path, !publicMode)
  const pinned = usePinnedMedia(path, publicMode && pin ? pin : null)
  const src = publicMode
    ? (pin ? pinned : mediaUrl(path))
    : authedUrl

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
    reactedByMe: !!p.reactedByMe,
    isHighlight: !!p.isHighlight,
    createdAt: p.createdAt || new Date().toISOString(),
    exif: p.camera ? { camera: p.camera } : undefined,
    mediumPath: p.mediumUrl || p.originalUrl || '',
    thumbnailPath: p.thumbnailUrl || p.mediumUrl || '',
    originalPath: p.originalUrl || p.mediumUrl || '',
    albumId: p.albumId ?? null,
    downloadEnabled: p.downloadEnabled !== false,
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

type GalleryTab = 'all' | 'albums' | 'highlights' | 'favorites'

interface ShareAlbum {
  id: string
  name: string
  description?: string | null
  photoCount: number
  coverUrl?: string | null
  downloadEnabled: boolean
}

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
    welcomeMessage?: string | null
    groupName?: string | null
    groupIconUrl?: string | null
  } | null>(null)
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [displayCount, setDisplayCount] = useState(PHOTOS_PER_LOAD)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [pin, setPin] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !shareCode) return null
    try { return localStorage.getItem(`share-pin-${shareCode}`) } catch { return null }
  })
  const [pinRequired, setPinRequired] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [guestOpen, setGuestOpen] = useState(false)
  const [livenessRequired, setLivenessRequired] = useState(false)
  const [guestRequired, setGuestRequired] = useState(false)
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = isShare
        ? getGuestSession()
        : JSON.parse(localStorage.getItem('auth') || 'null')
      const session = isShare ? stored : (stored?.token ? stored : getGuestSession())
      return !!session?.token
    } catch { return false }
  })
  const [guestUser, setGuestUser] = useState<{ name?: string; phone?: string } | null>(() => {
    if (typeof window === 'undefined') return null
    const session = getGuestSession()
    return session?.user ? { name: session.user.name, phone: session.user.phone } : null
  })

  const [tab, setTab] = useState<GalleryTab>('all')
  const [albums, setAlbums] = useState<ShareAlbum[]>([])
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [tabLoading, setTabLoading] = useState(true)

  const filteredPhotos = useMemo(() => {
    if (tab === 'favorites') return photos.filter((p) => p.reactedByMe || p.favorite)
    return photos
  }, [photos, tab])

  const visiblePhotos = useMemo(
    () => filteredPhotos.slice(0, displayCount),
    [filteredPhotos, displayCount],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const extraHeaders: Record<string, string> = {}
        if (isShare && pin) extraHeaders['X-Gallery-Pin'] = pin

        if (shareCode) {
          const gallery = await apiFetch<ShareGalleryInfo>(`/api/v1/share/${shareCode}`, { headers: extraHeaders })
          if (cancelled) return
          setWedding(gallery.wedding)
          setShare({
            code: gallery.share.code,
            role: gallery.share.role,
            downloadEnabled: !!gallery.share.downloadEnabled,
            downloadAllowed: !!gallery.downloadAllowed,
            welcomeMessage: gallery.welcomeMessage ?? null,
            groupName: gallery.groupName ?? null,
            groupIconUrl: gallery.groupIconUrl ?? null,
          })
          setLivenessRequired(!!gallery.livenessEnabled)

          const albumList = await apiFetch<ShareAlbum[]>(
            `/api/v1/share/${shareCode}/albums`,
            { headers: extraHeaders },
          )
          if (cancelled) return
          setAlbums((albumList || []).map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description ?? null,
            photoCount: a.photoCount ?? 0,
            coverUrl: a.coverUrl ?? null,
            downloadEnabled: a.downloadEnabled !== false,
          })))
        } else if (weddingCode) {
          const w = await apiFetch<WeddingInfo>(`/api/v1/weddings/by-code/${weddingCode}`)
          if (cancelled) return
          setWedding(w)
          setShare(null)

          const albumList = await apiFetch<ShareAlbum[]>(`/api/v1/weddings/${w.id}/albums/`)
          if (cancelled) return
          setAlbums((albumList || []).map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description ?? null,
            photoCount: a.photoCount ?? 0,
            coverUrl: a.coverUrl ?? null,
            downloadEnabled: a.downloadEnabled !== false,
          })))
        }
      } catch (e) {
        if (cancelled) return
        const err = e as ApiError
        const status = err?.status
        if (status === 403 && isShare && err?.code === 'participant_required') {
          setGuestRequired(true)
          setError(null)
          return
        }
        if (status === 403 && isShare) {
          if (err?.code === 'gallery_pin_required' && pin) {
            setPin(null)
            try { localStorage.removeItem(`share-pin-${shareCode}`) } catch { }
          }
          setPinRequired(true)
          setError(null)
          return
        }
        if (status === 404) setError('not-found')
        else if (status === 401 || status === 403) setError('private')
        else setError('error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shareCode, weddingCode, reloadKey, pin, isShare])

  // Keep a persisted guest session alive: refresh the access token when it is
  // near expiry so returning visitors stay signed in across reloads.
  useEffect(() => {
    const session = getGuestSession()
    if (!session?.refreshToken) return
    const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : 0
    if (expiresAt && expiresAt - Date.now() > 5 * 60 * 1000) return
    let cancelled = false
    apiFetch<{ accessToken: string; refreshToken: string; expiresAt: string }>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refresh_token: session.refreshToken }) },
    )
      .then((res) => {
        if (cancelled) return
        setGuestSession({
          token: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
          user: getGuestSession()?.user || null,
        })
        setAuthed(true)
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [isShare])

  useEffect(() => {
    if (loading || !wedding) return
    let cancelled = false
    const params = new URLSearchParams({ page_size: '200' })
    if (tab === 'highlights') params.set('is_highlight', 'true')
    if (tab === 'albums' && activeAlbumId) params.set('album_id', activeAlbumId)

    const base = isShare
      ? `/api/v1/share/${shareCode}/photos`
      : `/api/v1/weddings/${wedding.id}/photos`

    const extraHeaders: Record<string, string> = {}
    if (isShare && pin) extraHeaders['X-Gallery-Pin'] = pin

    apiFetch<PaginatedPhotos<BackendPhoto>>(`${base}?${params.toString()}`, { headers: extraHeaders })
      .then((listing) => {
        if (cancelled) return
        setPhotos((listing.items || []).map(mapClientPhoto))
        setDisplayCount(PHOTOS_PER_LOAD)
      })
      .catch(() => {
        if (!cancelled) setPhotos([])
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false)
      })
    return () => { cancelled = true }
  }, [tab, activeAlbumId, wedding, isShare, shareCode, reloadKey, loading, pin])

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) return
    setPinLoading(true)
    setPinError(null)
    try {
      const res = await apiFetch<{ valid: boolean }>(`/api/v1/share/${shareCode}/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin: pinInput.trim() }),
      })
      if (res.valid) {
        const saved = pinInput.trim()
        try { localStorage.setItem(`share-pin-${shareCode}`, saved) } catch { }
        setPin(saved)
        setPinRequired(false)
        setPinInput('')
        setReloadKey(k => k + 1)
      } else {
        setPinError('Incorrect PIN. Please try again.')
      }
    } catch {
      setPinError('Could not verify the PIN. Please try again.')
    } finally {
      setPinLoading(false)
    }
  }

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
    const count = filteredPhotos.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % count))
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? prev : (prev - 1 + count) % count,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, filteredPhotos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const handleToggleFavorite = (photoId: string) => {
    if (!authed && isShare) {
      setGuestOpen(true)
      return
    }
    const photo = photos.find((p) => p.id === photoId)
    const react = !(photo?.favorite ?? false)
    apiFetch<BackendPhoto>(`/api/v1/photos/${photoId}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ reacted: react }),
    })
      .then(() => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, favorite: react, reactedByMe: react } : p,
          ),
        )
        toast({ title: react ? 'Loved this photo' : 'Reaction removed', variant: 'success' })
      })
      .catch(() => {
        toast({ title: 'Could not update favorite', variant: 'error' })
      })
  }

  const handleDownloadPhoto = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId)
    let blob: Blob | null = null
    const finish = () => {
      if (!blob) return
      const name = (photo?.alt || 'photo').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
      saveBlobAs(blob, `${name || 'photo'}.jpg`)
    }
    const path = isShare
      ? `/api/v1/media/share/${shareCode}/photos/${photoId}/content?size=original`
      : `/api/v1/photos/${photoId}/download`
    const headers: Record<string, string> = {}
    if (isShare && pin) headers['X-Gallery-Pin'] = pin
    apiFetchBlob(path, headers)
      .then((res) => { blob = res; finish() })
      .catch(() => {
        toast({ title: 'Download not permitted for this gallery', variant: 'error' })
      })
  }

  const handleDownloadAll = () => {
    if (photos.length === 0) return
    const ids = photos.map((p) => p.id).join(',')
    toast({ title: 'Preparing ZIP download...', variant: 'success' })
    const path = isShare
      ? `/api/v1/media/share/${shareCode}/photos/${photos[0].id}/content?size=original`
      : `/api/v1/photos/download?photo_ids=${ids}`
    const headers: Record<string, string> = {}
    if (isShare && pin) headers['X-Gallery-Pin'] = pin
    if (!isShare) {
      apiFetchBlob(path)
        .then((blob) => {
          const base = (wedding?.weddingName || 'gallery').replace(/\s+/g, '-').toLowerCase()
          saveBlobAs(blob, `${base}-photos.zip`)
        })
        .catch(() => {
          toast({ title: 'Download not permitted for this gallery', variant: 'error' })
        })
      return
    }
    if (hdAllowed) toast({ title: 'HD downloads are enabled on this gallery', variant: 'success' })
    else toast({ title: 'Download not permitted for this gallery', variant: 'error' })
  }

  const handleAuthed = () => {
    if (isShare) {
      const session = getGuestSession()
      setGuestUser(session?.user ? { name: session.user.name, phone: session.user.phone } : null)
    }
    setAuthed(true)
    setGuestRequired(false)
    setGuestOpen(false)
    setReloadKey((k) => k + 1)
  }

  const handleSignOutGuest = () => {
    clearGuestSession()
    setAuthed(false)
    setGuestUser(null)
    setGuestRequired(false)
    setReloadKey((k) => k + 1)
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

  if (pinRequired && isShare) {
    return (
      <Shell>
        <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07)_0%,transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative w-full max-w-sm"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
              <Icon name="lock" size={28} className="text-gold" />
            </div>
            <h1 className="font-serif text-2xl text-foreground">Private Gallery</h1>
            <p className="mt-2 text-sm text-muted">
              This gallery is protected. Enter the PIN to view the wedding photos.
            </p>

            <div className="mt-8 rounded-2xl border border-gold/15 bg-card p-6">
              <div className="mx-auto max-w-[180px]">
                <Input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 4-6 digit PIN"
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit() }}
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>
              {pinError && <p className="mt-3 text-xs text-red-400">{pinError}</p>}
              <Button className="mt-5 w-full" onClick={handlePinSubmit} disabled={pinLoading || !pinInput.trim()}>
                <Icon name="lock-open" size={16} />
                {pinLoading ? 'Checking…' : 'Unlock Gallery'}
              </Button>
            </div>

            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
              <Icon name="globe" size={14} />
              Back to TJ Photography
            </Link>
          </motion.div>
        </div>
      </Shell>
    )
  }

  if (guestRequired && isShare) {
    return (
      <Shell>
        <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07)_0%,transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative w-full max-w-sm"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
              <Icon name="user" size={28} className="text-gold" />
            </div>
            <h1 className="font-serif text-2xl text-foreground">Private Gallery</h1>
            <p className="mt-2 text-sm text-muted">
              This gallery is private to the wedding guests. Verify your number with the code TJ sent to view and like the photos.
            </p>

            <div className="mt-8 rounded-2xl border border-gold/15 bg-card p-6">
              <Button className="w-full" onClick={() => setGuestOpen(true)}>
                <Icon name="message" size={16} />
                Verify My Number
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted">
                A one-time code is sent to your phone. No account or password needed.
              </p>
            </div>

            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
              <Icon name="globe" size={14} />
              Back to TJ Photography
            </Link>
          </motion.div>
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
  const hdAllowed = isShare
    ? (share?.downloadAllowed ?? false) && (share?.downloadEnabled ?? false)
    : wedding?.galleryDownloadEnabled !== false
  const canFavorite = true
  const canDownload = hdAllowed
  const welcomeText = isShare ? (share?.welcomeMessage ?? null) : (wedding?.welcomeMessage ?? null)
  const groupName = isShare ? (share?.groupName ?? null) : (wedding?.groupName ?? null)
  const groupIcon = isShare ? (share?.groupIconUrl ?? null) : (wedding?.groupIconUrl ?? null)
  const showingAlbumList = tab === 'albums' && !activeAlbumId
  const availableCount = showingAlbumList
    ? `${albums.length} album${albums.length !== 1 ? 's' : ''}`
    : `${filteredPhotos.length} photo${filteredPhotos.length !== 1 ? 's' : ''}`
  const galleryEmpty = filteredPhotos.length === 0

  const tabs: { key: GalleryTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All Photos', icon: 'images' },
    { key: 'albums', label: 'Albums', icon: 'folder' },
    { key: 'highlights', label: 'Highlights', icon: 'star' },
    { key: 'favorites', label: 'Liked', icon: 'heart' },
  ]

  const handleSelectTab = (next: GalleryTab) => {
    if (next === tab) return
    setTabLoading(true)
    setTab(next)
    setActiveAlbumId(null)
    setLightboxIndex(null)
  }

  const handleOpenAlbum = (albumId: string) => {
    setTabLoading(true)
    setActiveAlbumId(albumId)
    setLightboxIndex(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
            <div className="flex items-center gap-2">
              {isShare && authed && (
                <span className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold">
                  <Icon name="user" size={11} />
                  <span className="truncate">{guestUser?.name || 'Verified Guest'}</span>
                  <button
                    type="button"
                    onClick={handleSignOutGuest}
                    title="Sign out of this gallery"
                    className="ml-0.5 text-gold/60 transition-colors hover:text-gold"
                  >
                    <Icon name="x" size={10} />
                  </button>
                </span>
              )}
              {code && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-medium tracking-wide text-gold">
                  <Icon name="lock" size={11} />
                  {code}
                </span>
              )}
            </div>
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
            {(groupName || groupIcon) && (
              <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5">
                {groupIcon && (
                  <img
                    src={groupIcon}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                    loading="lazy"
                  />
                )}
                {groupName && (
                  <span className="text-xs font-medium tracking-wide text-gold">{groupName}</span>
                )}
              </div>
            )}
            {welcomeText && (
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
                {welcomeText}
              </p>
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
                <Icon name={showingAlbumList ? 'folder' : 'images'} size={13} />
                {availableCount}
              </span>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {canDownload && !showingAlbumList && (
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
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {tabs.map((t) => {
              const active = tab === t.key || (t.key === 'albums' && tab === 'albums')
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleSelectTab(t.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-gold text-black'
                      : 'border border-white/10 text-muted hover:border-gold/40 hover:text-foreground',
                  )}
                >
                  <Icon name={t.icon as 'images'} size={14} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {showingAlbumList ? (
            albums.length === 0 ? (
              <EmptyState
                icon="folder"
                title="No albums yet"
                description="TJ can group your photos into albums — check back soon."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {albums.map((album, index) => (
                  <motion.button
                    key={album.id}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    onClick={() => handleOpenAlbum(album.id)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-white/5 bg-card text-left"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                      {album.coverUrl ? (
                        <GalleryMedia
                          publicMode={isShare}
                          pin={pin}
                          path={album.coverUrl}
                          alt={album.name}
                          className="transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Icon name="folder" size={28} className="text-white/15" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="truncate text-xs text-white/90">{album.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <span className="truncate text-sm font-medium text-foreground">{album.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )
          ) : (
            <>
              {activeAlbumId && (
                <div className="mb-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveAlbumId(null)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    <Icon name="chevron-left" size={15} />
                    All albums
                  </button>
                  <span className="truncate text-sm font-medium text-foreground">
                    {albums.find((a) => a.id === activeAlbumId)?.name}
                  </span>
                </div>
              )}

              {tabLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                </div>
              ) : galleryEmpty ? (
                <EmptyState
                  icon={tab === 'favorites' ? 'heart' : tab === 'highlights' ? 'star' : 'images'}
                  title={
                    tab === 'favorites'
                      ? 'No liked photos yet'
                      : tab === 'highlights'
                        ? 'No highlights yet'
                        : 'No photos yet'
                  }
                  description={
                    tab === 'favorites'
                      ? (isShare && !authed
                          ? 'Sign in with your phone to like photos. They will appear here.'
                          : 'Tap the heart on any photo and it will appear here.')
                      : tab === 'highlights'
                        ? 'TJ has not marked any highlights for this gallery yet.'
                        : tab === 'albums' && activeAlbumId
                          ? 'No photos in this album yet. Check back soon.'
                          : isShare
                            ? 'TJ will upload your wedding moments here. Check back soon.'
                            : 'This wedding has no photos uploaded yet. Check back soon.'
                  }
                  action={
                    tab === 'favorites' && isShare && !authed ? (
                      <Button onClick={() => setGuestOpen(true)} size="sm" variant="secondary">
                        <Icon name="heart" size={14} />
                        Sign in to like photos
                      </Button>
                    ) : undefined
                  }
                />
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
                          pin={pin}
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
                    {displayCount < filteredPhotos.length ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                    ) : (
                      <p className="text-xs text-muted/60">
                        All {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} loaded
                      </p>
                    )}
                  </div>
                </>
              )}
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
        {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
          <GalleryLightbox
            key={`lb-${lightboxIndex}`}
            photos={filteredPhotos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
            isShare={isShare}
            pin={pin}
            canFavorite={canFavorite}
            canDownload={canDownload}
            hdAllowed={hdAllowed}
            onFavorite={handleToggleFavorite}
            onDownload={handleDownloadPhoto}
          />
        )}
      </AnimatePresence>
    <ClientLoginModal
        open={guestOpen}
        shareCode={isShare ? shareCode : undefined}
        onClose={() => setGuestOpen(false)}
        onAuthed={handleAuthed}
        livenessRequired={livenessRequired}
      />
    </Shell>
  )
}

function GalleryLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  isShare,
  pin,
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
  pin: string | null
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
            pin={pin}
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

