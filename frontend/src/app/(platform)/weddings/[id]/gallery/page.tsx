'use client'

import { useState, useEffect, useCallback, useRef, use, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { Dropdown } from '@/components/ui/dropdown'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { GallerySkeleton } from '@/components/ui/skeleton'
import { PhotoDetailModal } from '@/components/ui/photo-detail-modal'
import { ShareLinkModal } from '@/components/platform/share-link-modal'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import type { Photo, Album, Folder } from '@/types/platform'

const PHOTOS_PER_PAGE = 20
const PHOTOS_PER_LOAD = 12

function getDateOnly(dateStr: string) {
  return dateStr.split('T')[0]
}

export default function WeddingGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()

  const [wedding, setWedding] = useState<any>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(PHOTOS_PER_PAGE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('all')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [highlightsOnly, setHighlightsOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry')

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailIndex, setDetailIndex] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; photo: Photo } | null>(null)

  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState<Photo[]>([])

  const [apiPhotos, setApiPhotos] = useState<Photo[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [slideshowActive, setSlideshowActive] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {},
  })

  const [filtersOpen, setFiltersOpen] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadData() {
      try {
        const [weddingData, albumsData, foldersData, photosData] = await Promise.all([
          apiFetch<any>(`/api/v1/weddings/${id}`),
          apiFetch<any[]>(`/api/v1/weddings/${id}/albums`),
          apiFetch<any[]>(`/api/v1/weddings/${id}/folders`),
          apiFetch<any>(`/api/v1/weddings/${id}/photos?page_size=200`),
        ])

        setWedding(weddingData)
        setAlbums(albumsData || [])
        setFolders(foldersData || [])

        const items: Photo[] = ((photosData?.items || photosData || []) as any[]).map(p => ({
          id: p.id,
          weddingId: p.weddingId,
          src: p.originalUrl || p.mediumUrl || p.thumbnailUrl || '',
          alt: p.altText || p.filename,
          width: p.width || 800,
          height: p.height || 600,
          blurDataURL: p.blurHash || undefined,
          favorite: p.favorite,
          isHighlight: p.isHighlight,
          createdAt: p.createdAt,
          exif: (p.camera || p.lens) ? {
            camera: p.camera,
            lens: p.lens,
            aperture: p.aperture,
            shutterSpeed: p.shutterSpeed,
            iso: p.iso,
            focalLength: p.focalLength,
            dateTaken: p.dateTaken,
          } : undefined,
          folderId: p.folderId,
          albumId: p.albumId,
        }))
        setApiPhotos(items)
      } catch (e) {
        console.error('Failed to load gallery data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const allPhotos = useMemo(
    () => apiPhotos
      .filter(p => !deletedIds.has(p.id))
      .filter(p => !hiddenIds.has(p.id)),
    [apiPhotos, deletedIds, hiddenIds]
  )

  const filteredPhotos = useMemo(() => {
    return allPhotos.filter(photo => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = photo.alt.toLowerCase().includes(q)
        const matchAlbum = albums.find(a => a.id === photo.albumId)?.name.toLowerCase().includes(q)
        const matchFolder = folders.find(f => f.id === photo.folderId)?.name.toLowerCase().includes(q)
        if (!matchName && !matchAlbum && !matchFolder) return false
      }
      if (selectedAlbum !== 'all' && photo.albumId !== selectedAlbum) return false
      if (selectedFolder !== 'all' && photo.folderId !== selectedFolder) return false
      if (dateFilter && getDateOnly(photo.createdAt) !== dateFilter) return false
      if (favoritesOnly && !favorites.has(photo.id)) return false
      if (highlightsOnly && !photo.isHighlight) return false
      return true
    })
  }, [allPhotos, searchQuery, selectedAlbum, selectedFolder, dateFilter, favoritesOnly, highlightsOnly, favorites, albums, folders])

  const displayedPhotos = useMemo(() => filteredPhotos.slice(0, displayCount), [filteredPhotos, displayCount])
  const hasMore = displayCount < filteredPhotos.length

  const hasActiveFilters = searchQuery || selectedAlbum !== 'all' || selectedFolder !== 'all' || dateFilter || favoritesOnly || highlightsOnly

  const dateRange = useMemo(() => {
    if (allPhotos.length === 0) return null
    const dates = allPhotos.map(p => p.createdAt).sort()
    return `${formatDate(dates[0], 'short')} – ${formatDate(dates[dates.length - 1], 'short')}`
  }, [allPhotos])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedAlbum('all')
    setSelectedFolder('all')
    setDateFilter('')
    setFavoritesOnly(false)
    setHighlightsOnly(false)
  }, [])

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set(prev).add(id))
  }, [])

  const toggleFavorite = useCallback((photoId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }, [])

  const handleDownload = useCallback((photoId: string) => {
    const photo = allPhotos.find(p => p.id === photoId)
    toast({
      title: 'Download started',
      description: photo ? `Downloading "${photo.alt}"` : 'Preparing download...',
      variant: 'success',
    })
  }, [allPhotos, toast])

  const handleDownloadAll = useCallback(() => {
    toast({ title: 'Preparing zip download...', variant: 'success' })
  }, [toast])

  const toggleSelect = useCallback((photoId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(displayedPhotos.map(p => p.id)))
  }, [displayedPhotos])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const batchFavorite = useCallback(() => {
    selectedIds.forEach(id => toggleFavorite(id))
    toast({ title: `${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} favorited`, variant: 'success' })
    setSelectedIds(new Set())
  }, [selectedIds, toggleFavorite, toast])

  const batchDownload = useCallback(() => {
    toast({ title: `Downloading ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''}...`, variant: 'success' })
    setSelectedIds(new Set())
  }, [selectedIds, toast])

  const batchDelete = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Delete Photos',
      description: `Are you sure you want to delete ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: () => {
        setDeletedIds(prev => new Set([...prev, ...selectedIds]))
        setSelectedIds(new Set())
        setConfirmDialog(prev => ({ ...prev, open: false }))
        toast({ title: `${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} deleted`, variant: 'success' })
      },
    })
  }, [selectedIds, toast])

  const batchHide = useCallback(() => {
    setHiddenIds(prev => new Set([...prev, ...selectedIds]))
    setSelectedIds(new Set())
    toast({ title: `${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} hidden`, variant: 'success' })
  }, [selectedIds, toast])

  const batchAddToAlbum = useCallback(() => {
    toast({ title: `Added ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} to album`, variant: 'success' })
    setSelectedIds(new Set())
  }, [selectedIds, toast])

  const batchMoveToFolder = useCallback(() => {
    toast({ title: `Moved ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} to folder`, variant: 'success' })
    setSelectedIds(new Set())
  }, [selectedIds, toast])

  const handlePhotoClick = useCallback((photo: Photo, index: number) => {
    if (selectMode) {
      toggleSelect(photo.id)
      return
    }
    if (compareMode) {
      if (comparePhotos.length === 0) {
        setComparePhotos([photo])
      } else if (comparePhotos.length === 1) {
        if (comparePhotos[0].id === photo.id) {
          setComparePhotos([])
          return
        }
        setComparePhotos(prev => [...prev, photo])
      } else {
        setComparePhotos([photo])
      }
      return
    }
    setDetailIndex(index)
    setDetailModalOpen(true)
  }, [selectMode, compareMode, comparePhotos, toggleSelect])

  const openPhotoDetail = useCallback((index: number) => {
    setDetailIndex(index)
    setDetailModalOpen(true)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, photo: Photo) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, photo })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    const handler = () => closeContextMenu()
    window.addEventListener('scroll', handler, { capture: true })
    return () => window.removeEventListener('scroll', handler, { capture: true })
  }, [closeContextMenu])

  const handleDeletePhoto = useCallback((photoId: string) => {
    const photo = allPhotos.find(p => p.id === photoId)
    setConfirmDialog({
      open: true,
      title: 'Delete Photo',
      description: `Are you sure you want to delete "${photo?.alt || 'this photo'}"?`,
      onConfirm: () => {
        setDeletedIds(prev => new Set([...prev, photoId]))
        setContextMenu(null)
        setConfirmDialog(prev => ({ ...prev, open: false }))
        toast({ title: 'Photo deleted', variant: 'success' })
      },
    })
  }, [allPhotos, toast])

  const handleHidePhoto = useCallback((photoId: string) => {
    setHiddenIds(prev => new Set([...prev, photoId]))
    setContextMenu(null)
    toast({ title: 'Photo hidden', variant: 'success' })
  }, [toast])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + PHOTOS_PER_LOAD)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  const allIdsSelected = displayedPhotos.length > 0 && selectedIds.size === displayedPhotos.length
  const someSelected = selectedIds.size > 0

  if (!wedding) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted">Wedding not found</p>
      </div>
    )
  }

  const galleryEmpty = allPhotos.length === 0 && !loading

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb items={[
            { label: 'Weddings', href: '/weddings' },
            { label: wedding.weddingName, href: `/weddings/${id}` },
            { label: 'Gallery' },
          ]} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl text-foreground tracking-tight">{wedding.weddingName} Gallery</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted/80">
                <span className="font-medium text-foreground/80">{allPhotos.length}</span>
                <span>photo{allPhotos.length !== 1 ? 's' : ''}</span>
                <span className="text-white/10">·</span>
                {dateRange && <><span>Uploaded {dateRange}</span><span className="text-white/10">·</span></>}
                {hasActiveFilters && (
                  <span className="text-gold">
                    Showing {filteredPhotos.length} of {allPhotos.length}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-8 px-3 text-xs bg-white/10 text-foreground hover:bg-white/20"
              >
                <Icon name="upload" size={16} />
                Upload
              </Link>
              <Button variant="secondary" size="sm" onClick={handleDownloadAll}>
                <Icon name="download" size={16} />
                Download All
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShareModalOpen(true)}>
                <Icon name="share" size={16} />
                Share
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSlideshowActive(true)
                  setDetailIndex(0)
                  setDetailModalOpen(true)
                }}
                disabled={filteredPhotos.length === 0}
              >
                <Icon name="play" size={16} />
                Slideshow
              </Button>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('masonry')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'masonry' ? 'bg-gold text-black' : 'text-muted hover:text-foreground bg-card'
                  )}
                  title="Masonry view"
                >
                  <Icon name="columns" size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid' ? 'bg-gold text-black' : 'text-muted hover:text-foreground bg-card'
                  )}
                  title="Grid view"
                >
                  <Icon name="grid" size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors lg:hidden"
            >
              <Icon name="filter" size={16} />
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
              <Icon
                name="chevron-down"
                size={14}
                className={cn('transition-transform', filtersOpen && 'rotate-180')}
              />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              {!compareMode && (
                <button
                  onClick={() => {
                    setSelectMode(!selectMode)
                    if (selectMode) setSelectedIds(new Set())
                  }}
                  className={cn(
                    'flex items-center gap-2 text-sm transition-colors',
                    selectMode ? 'text-gold' : 'text-muted hover:text-foreground'
                  )}
                >
                  <Icon name={selectMode ? 'x' : 'check'} size={16} />
                  {selectMode ? 'Exit Select' : 'Select'}
                </button>
              )}
              {!selectMode && (
                <button
                  onClick={() => {
                    setCompareMode(!compareMode)
                    setComparePhotos([])
                  }}
                  className={cn(
                    'flex items-center gap-2 text-sm transition-colors',
                    compareMode ? 'text-gold' : 'text-muted hover:text-foreground'
                  )}
                >
                  <Icon name="copy-plus" size={16} />
                  {compareMode ? 'Exit Compare' : 'Compare'}
                </button>
              )}
            </div>
          </div>

          <div className={cn('sticky top-0 z-20 bg-black/90 backdrop-blur-xl py-3 -mx-6 px-6 space-y-4 mb-6', !filtersOpen && 'hidden lg:block')}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search photos, albums, folders..."
                  icon={<Icon name="search" size={16} />}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                options={[
                  { label: 'All Albums', value: 'all' },
                  ...albums.map(a => ({ label: `${a.name} (${a.photoCount})`, value: a.id })),
                ]}
                value={selectedAlbum}
                onChange={e => { setSelectedAlbum(e.target.value); setSelectedFolder('all') }}
                className="w-40"
              />
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    selectedFolder === 'all' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
                  )}
                >
                  All
                </button>
                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                      selectedFolder === f.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
                    )}
                  >
                    <Icon name="folder" size={12} />
                    {f.name}
                    <span className="opacity-60">({f.photoCount})</span>
                  </button>
                ))}
              </div>
              <div className="w-36">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
              <Switch checked={favoritesOnly} onChange={setFavoritesOnly} label="Favorites" />
              <Switch checked={highlightsOnly} onChange={setHighlightsOnly} label="Highlights" />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Icon name="x" size={14} />
                  Clear Filters
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">
              Showing {filteredPhotos.length} of {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
              {hasActiveFilters && selectedAlbum !== 'all' && ` in album`}
              {hasActiveFilters && selectedFolder !== 'all' && ` in folder`}
            </p>
          </div>

          {loading ? (
            <GallerySkeleton />
          ) : galleryEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Icon name="image" size={28} className="text-muted" />
              </div>
              <h3 className="font-serif text-lg text-foreground">No photos uploaded yet</h3>
              <p className="mt-1 text-sm text-muted">This wedding gallery is empty. Upload photos to get started.</p>
              <Link
                href="/upload"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-gold text-black hover:bg-gold-light active:bg-gold-dark"
              >
                <Icon name="upload" size={16} />
                Upload Photos
              </Link>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Icon name="search" size={28} className="text-muted" />
              </div>
              <h3 className="font-serif text-lg text-foreground">No photos found</h3>
              <p className="mt-1 text-sm text-muted">Try adjusting your filters or search query.</p>
              <Button className="mt-6" variant="outline" size="sm" onClick={clearFilters}>
                <Icon name="x" size={14} />
                Clear Filters
              </Button>
            </div>
          ) : compareMode && comparePhotos.length === 2 ? (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparePhotos.map((photo, idx) => (
                  <div key={photo.id} className="relative overflow-hidden rounded-xl border border-border bg-card">
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="info">Photo {idx + 1}</Badge>
                    </div>
                    <button
                      onClick={() => setComparePhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <Icon name="x" size={14} />
                    </button>
                    {photo.src ? (
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]"
                        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                      >
                        <Icon name="image" size={32} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-sm text-white/80">{photo.alt}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                        <span>{photo.width} × {photo.height}</span>
                        {photo.exif?.camera && <span>{photo.exif.camera}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setCompareMode(false); setComparePhotos([]) }}
                className="mt-4 mx-auto block text-sm text-muted hover:text-foreground transition-colors"
              >
                <Icon name="x" size={14} className="inline mr-1" />
                Exit Compare Mode
              </button>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === 'masonry'
                  ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3'
                  : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
              )}
            >
              {displayedPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={cn(
                    'relative overflow-hidden rounded-xl bg-card border border-white/5 transition-all duration-300 group',
                    viewMode === 'masonry' ? 'break-inside-avoid mb-3' : '',
                    selectMode && 'cursor-pointer',
                    !selectMode && !compareMode && 'hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 cursor-pointer',
                    compareMode && comparePhotos.length < 2 && comparePhotos.some(p => p.id === photo.id) && 'ring-2 ring-gold',
                    compareMode && comparePhotos.length >= 2 && 'opacity-50 pointer-events-none',
                  )}
                  onClick={() => handlePhotoClick(photo, index)}
                  onContextMenu={e => handleContextMenu(e, photo)}
                >
                  <div
                    className={cn(
                      'relative w-full overflow-hidden',
                      viewMode === 'grid' && 'aspect-square'
                    )}
                    style={viewMode === 'masonry' ? { aspectRatio: `${photo.width}/${photo.height}` } : undefined}
                  >
                    {photo.src ? (
                      <>
                        {!loadedImages.has(photo.id) && (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a] animate-pulse" />
                        )}
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className={cn(
                            'h-full w-full object-cover transition-all duration-500 group-hover:scale-105',
                            loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
                          )}
                          loading="lazy"
                          decoding="async"
                          onLoad={() => handleImageLoad(photo.id)}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a] flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10">
                          <Icon name="image" size={20} className="text-white/20" />
                        </div>
                      </div>
                    )}

                    {selectMode && (
                      <div className="absolute inset-0 z-20 flex items-start justify-start p-3">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all',
                            selectedIds.has(photo.id)
                              ? 'bg-gold border-gold text-black'
                              : 'border-white/50 bg-black/30'
                          )}
                        >
                          {selectedIds.has(photo.id) && <Icon name="check" size={14} />}
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 z-10 flex gap-1.5">
                      {photo.isHighlight && (
                        <Badge variant="warning" className="backdrop-blur-sm">
                          <Icon name="star" size={10} className="mr-1" />
                          Highlight
                        </Badge>
                      )}
                      {favorites.has(photo.id) && !photo.isHighlight && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/30 backdrop-blur-sm">
                          <Icon name="heart" size={10} className="text-red-400" />
                        </span>
                      )}
                    </div>

                    {!selectMode && !compareMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); toggleFavorite(photo.id) }}
                              className={cn(
                                'rounded-full p-2 backdrop-blur-sm transition-all hover:scale-110',
                                favorites.has(photo.id) ? 'bg-red-500/30 text-red-400' : 'bg-black/60 text-white hover:bg-gold/80 hover:text-black'
                              )}
                              title={favorites.has(photo.id) ? 'Unfavorite' : 'Favorite'}
                            >
                              <Icon
                                name="heart"
                                size={14}
                                className={favorites.has(photo.id) ? 'fill-red-400' : ''}
                              />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDownload(photo.id) }}
                              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-gold/80 hover:text-black transition-all hover:scale-110"
                              title="Download"
                            >
                              <Icon name="download" size={14} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); openPhotoDetail(index) }}
                              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-gold/80 hover:text-black transition-all hover:scale-110"
                              title="Info"
                            >
                              <Icon name="info" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredPhotos.length > 0 && !(compareMode && comparePhotos.length === 2) && (
            <>
              <div ref={sentinelRef} className="flex items-center justify-center py-8">
                {hasMore ? (
                  <div className="flex flex-col items-center gap-3 text-sm text-muted">
                    <div className="relative h-8 w-8">
                      <span className="absolute inset-0 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                      <span className="absolute inset-1 animate-spin rounded-full border-2 border-gold/20 border-b-gold" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    </div>
                    <span>Loading more photos...</span>
                    <button
                      onClick={() => setDisplayCount(prev => prev + PHOTOS_PER_LOAD)}
                      className="text-xs text-gold hover:text-gold-light underline underline-offset-2 transition-colors"
                    >
                      Click to load more
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted/60">
                    All {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} loaded
                  </p>
                )}
              </div>
            </>
          )}

          <AnimatePresence>
            {selectMode && someSelected && (
              <div className="sticky bottom-0 left-0 right-0 z-40 mt-8">
                <motion.div
                  initial={{ y: 80 }}
                  animate={{ y: 0 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="mx-auto max-w-4xl rounded-2xl border border-gold/20 bg-black/95 backdrop-blur-xl p-4 shadow-2xl shadow-gold/5"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={allIdsSelected ? deselectAll : selectAll}
                        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                      >
                        <div className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                          allIdsSelected ? 'bg-gold border-gold text-black' : 'border-white/30'
                        )}>
                          {allIdsSelected && <Icon name="check" size={12} />}
                        </div>
                        {allIdsSelected ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-0.5 text-sm font-semibold text-gold border border-gold/20">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black text-xs font-bold">
                          {selectedIds.size}
                        </span>
                        selected
                      </span>
                    </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={batchFavorite}>
                      <Icon name="heart" size={14} />
                      Favorite
                    </Button>
                    <Button variant="secondary" size="sm" onClick={batchDownload}>
                      <Icon name="download" size={14} />
                      Download
                    </Button>
                    <Dropdown
                      trigger={
                        <Button variant="secondary" size="sm">
                          <Icon name="folder" size={14} />
                          Album
                          <Icon name="chevron-down" size={12} />
                        </Button>
                      }
                      items={albums.map(a => ({
                        label: a.name,
                        value: a.id,
                        onClick: batchAddToAlbum,
                      }))}
                    />
                    <Dropdown
                      trigger={
                        <Button variant="secondary" size="sm">
                          <Icon name="folder" size={14} />
                          Folder
                          <Icon name="chevron-down" size={12} />
                        </Button>
                      }
                      items={folders.map(f => ({
                        label: f.name,
                        value: f.id,
                        onClick: batchMoveToFolder,
                      }))}
                    />
                    <Button variant="secondary" size="sm" onClick={batchHide}>
                      <Icon name="eye-off" size={14} />
                      Hide
                    </Button>
                    <Button variant="danger" size="sm" onClick={batchDelete}>
                      <Icon name="trash" size={14} />
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}>
                      <Icon name="x" size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}</AnimatePresence>
        </div>

        <PhotoDetailModal
          open={detailModalOpen}
          onClose={() => { setDetailModalOpen(false); setSlideshowActive(false) }}
          photos={filteredPhotos}
          initialIndex={detailIndex}
          onIndexChange={setDetailIndex}
          onFavorite={toggleFavorite}
          onDownload={handleDownload}
        />

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          weddingId={id}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant="danger"
        />

        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={closeContextMenu}
            >
              <div
                className="min-w-[200px] rounded-xl border border-border bg-card py-1 shadow-2xl backdrop-blur-xl"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { handleDownload(contextMenu.photo.id); closeContextMenu() }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
                >
                  <Icon name="download" size={14} className="text-muted" />
                  Download
                </button>
                <button
                  onClick={() => { setShareModalOpen(true); closeContextMenu() }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
                >
                  <Icon name="share" size={14} className="text-muted" />
                  Share
                </button>
                <div className="mx-3 my-1 border-t border-border" />
                <button
                  onClick={() => { toggleFavorite(contextMenu.photo.id); closeContextMenu() }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                    favorites.has(contextMenu.photo.id) ? 'text-red-400' : 'text-foreground'
                  )}
                >
                  <Icon
                    name="heart"
                    size={14}
                    className={favorites.has(contextMenu.photo.id) ? 'fill-red-400 text-red-400' : 'text-muted'}
                  />
                  {favorites.has(contextMenu.photo.id) ? 'Unfavorite' : 'Favorite'}
                </button>
                <Dropdown
                  trigger={
                    <div className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors cursor-pointer">
                      <Icon name="folder" size={14} className="text-muted" />
                      Add to Album
                      <Icon name="chevron-right" size={12} className="ml-auto text-muted" />
                    </div>
                  }
                  items={albums.length > 0 ? albums.map(a => ({
                    label: a.name,
                    value: a.id,
                    onClick: () => { toast({ title: `Added to "${a.name}"`, variant: 'success' }); closeContextMenu() },
                  })) : [{ label: 'No albums', value: 'none', onClick: () => {} }]}
                />
                <Dropdown
                  trigger={
                    <div className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors cursor-pointer">
                      <Icon name="folder" size={14} className="text-muted" />
                      Move to Folder
                      <Icon name="chevron-right" size={12} className="ml-auto text-muted" />
                    </div>
                  }
                  items={folders.length > 0 ? folders.map(f => ({
                    label: f.name,
                    value: f.id,
                    onClick: () => { toast({ title: `Moved to "${f.name}"`, variant: 'success' }); closeContextMenu() },
                  })) : [{ label: 'No folders', value: 'none', onClick: () => {} }]}
                />
                <div className="mx-3 my-1 border-t border-border" />
                {!hiddenIds.has(contextMenu.photo.id) && (
                  <button
                    onClick={() => handleHidePhoto(contextMenu.photo.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Icon name="eye-off" size={14} className="text-muted" />
                    Hide
                  </button>
                )}
                <button
                  onClick={() => { handleDeletePhoto(contextMenu.photo.id); closeContextMenu() }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="trash" size={14} />
                  Delete
                </button>
                <div className="mx-3 my-1 border-t border-border" />
                <button
                  onClick={() => { openPhotoDetail(filteredPhotos.indexOf(contextMenu.photo)); closeContextMenu() }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
                >
                  <Icon name="info" size={14} className="text-muted" />
                  View Info
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {contextMenu && (
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
        )}
      </div>
    </AuthGuard>
  )
}
