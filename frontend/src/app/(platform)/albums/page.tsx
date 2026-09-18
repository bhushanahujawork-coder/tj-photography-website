'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dropdown } from '@/components/ui/dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch, mediaUrl } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Album, Photo, Wedding } from '@/types/platform'

export default function AlbumsPage() {
  const { toast } = useToast()
  const [albums, setAlbums] = useState<Album[]>([])
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [albumModalOpen, setAlbumModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [viewingAlbum, setViewingAlbum] = useState<Album | null>(null)
  const [viewingPhotos, setViewingPhotos] = useState<Photo[]>([])
  const [viewLoading, setViewLoading] = useState(false)
  const [coverUpdating, setCoverUpdating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formWeddingId, setFormWeddingId] = useState('')
  const [formCover, setFormCover] = useState('')
  const [formDownloadEnabled, setFormDownloadEnabled] = useState(true)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [coverPhotos, setCoverPhotos] = useState<Photo[]>([])
  const [coverLoading, setCoverLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const weddingData = await apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
        setWeddings(weddingData.items)

        const allAlbums: Album[] = []
        for (const w of weddingData.items) {
          try {
            const albumList = await apiFetch<Album[]>(`/api/v1/weddings/${w.id}/albums/`)
            allAlbums.push(...albumList)
          } catch {
            // skip weddings without accessible albums
          }
        }
        setAlbums(allAlbums)
      } catch {
        // weddings fetch failed
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return albums
    const q = search.toLowerCase()
    return albums.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
    )
  }, [search, albums])

  function getWeddingName(weddingId: string) {
    return weddings.find((w) => w.id === weddingId)?.weddingName || 'Unknown'
  }

  function openCreate() {
    setEditingAlbum(null)
    setFormName('')
    setFormDescription('')
    setFormWeddingId(weddings[0]?.id || '')
    setFormCover('')
    setFormDownloadEnabled(true)
    setAlbumModalOpen(true)
  }

  function openEdit(album: Album) {
    setEditingAlbum(album)
    setFormName(album.name)
    setFormDescription(album.description || '')
    setFormWeddingId(album.weddingId)
    setFormCover(album.coverImageUrl || '')
    setFormDownloadEnabled(album.downloadEnabled ?? true)
    setAlbumModalOpen(true)
  }

  async function openCoverPicker() {
    if (!formWeddingId || coverPickerOpen) return
    setCoverPickerOpen(true)
    setCoverLoading(true)
    try {
      const res = await apiFetch<{ items?: Array<Record<string, unknown>> }>(
        `/api/v1/weddings/${formWeddingId}/photos?page_size=200`
      )
      const items = (res?.items || []) as Array<{
        id: string
        medium_url?: string | null
        thumbnail_url?: string | null
        original_url?: string | null
        alt_text?: string | null
        filename?: string
        width?: number | null
        height?: number | null
        created_at?: string
      }>
      setCoverPhotos(items.map(p => ({
        id: p.id,
        weddingId: formWeddingId,
        src: p.medium_url || p.thumbnail_url || p.original_url || '',
        alt: p.alt_text || p.filename || 'Photo',
        width: p.width || 800,
        height: p.height || 600,
        favorite: false,
        isHighlight: false,
        createdAt: p.created_at || '',
      })))
    } catch {
      setCoverPhotos([])
    } finally {
      setCoverLoading(false)
    }
  }

  function openView(album: Album) {
    setViewingAlbum(album)
    setViewModalOpen(true)
    setViewLoading(true)
    getAlbumPhotos(album.weddingId, album.id)
      .then(setViewingPhotos)
      .catch(() => {
        setViewingPhotos([])
        toast({ title: 'Failed to load photos', variant: 'error' })
      })
      .finally(() => setViewLoading(false))
  }

  function mapAlbum(a: {
    id: string
    wedding_id: string
    name: string
    description?: string | null
    cover_image_url?: string | null
    photo_count: number
    sort_order: number
    download_enabled?: boolean
    created_at: string
  }): Album {
    return {
      id: a.id,
      weddingId: a.wedding_id,
      name: a.name,
      description: a.description || undefined,
      coverImageUrl: a.cover_image_url || undefined,
      photoCount: a.photo_count,
      sortOrder: a.sort_order,
      downloadEnabled: a.download_enabled,
      createdAt: a.created_at,
    }
  }

  async function getAlbumPhotos(weddingId: string, albumId: string): Promise<Photo[]> {
    const res = await apiFetch<{ items?: Array<Record<string, unknown>> }>(
      `/api/v1/weddings/${weddingId}/photos?album_id=${albumId}&page_size=200`
    )
    const items = (res?.items || []) as Array<{
      id: string
      filename?: string
      alt_text?: string | null
      thumbnail_url?: string | null
      medium_url?: string | null
      original_url?: string | null
      blur_hash?: string | null
      width?: number | null
      height?: number | null
      created_at?: string
    }>
    return items.map(p => ({
      id: p.id,
      weddingId,
      src: p.medium_url || p.thumbnail_url || p.original_url || '',
      alt: p.alt_text || p.filename || 'Photo',
      width: p.width || 800,
      height: p.height || 600,
      blurDataURL: p.blur_hash || undefined,
      favorite: false,
      isHighlight: false,
      createdAt: p.created_at || '',
    }))
  }

  async function setCover(photo: Photo) {
    if (!viewingAlbum || !photo.src) return
    setCoverUpdating(true)
    try {
      await apiFetch(`/api/v1/weddings/${viewingAlbum.weddingId}/albums/${viewingAlbum.id}`, {
        method: 'PUT',
        body: JSON.stringify({ cover_image: photo.src }),
      })
      const cover = photo.src
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === viewingAlbum.id ? { ...a, coverImageUrl: cover } : a
        )
      )
      setViewingAlbum((prev) => (prev ? { ...prev, coverImageUrl: cover } : prev))
      toast({ title: 'Cover updated', variant: 'success' })
    } catch {
      toast({ title: 'Failed to update cover', variant: 'error' })
    } finally {
      setCoverUpdating(false)
    }
  }

  async function clearCover() {
    if (!viewingAlbum) return
    setCoverUpdating(true)
    try {
      await apiFetch(`/api/v1/weddings/${viewingAlbum.weddingId}/albums/${viewingAlbum.id}`, {
        method: 'PUT',
        body: JSON.stringify({ clear_cover: true }),
      })
      setAlbums((prev) =>
        prev.map((a) => (a.id === viewingAlbum.id ? { ...a, coverImageUrl: undefined } : a))
      )
      setViewingAlbum((prev) => (prev ? { ...prev, coverImageUrl: undefined } : prev))
      toast({ title: 'Cover removed', variant: 'success' })
    } catch {
      toast({ title: 'Failed to remove cover', variant: 'error' })
    } finally {
      setCoverUpdating(false)
    }
  }

  async function handleDelete() {
    if (!viewingAlbum) return
    try {
      await apiFetch(`/api/v1/weddings/${viewingAlbum.weddingId}/albums/${viewingAlbum.id}`, {
        method: 'DELETE',
      })
      setAlbums((prev) => prev.filter((a) => a.id !== viewingAlbum.id))
      toast({ title: 'Album deleted', variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete album', variant: 'error' })
    } finally {
      setDeleteConfirmOpen(false)
    }
  }

  async function handleSave() {
    if (!formName.trim() || !formWeddingId) return

    try {
      if (editingAlbum) {
        const updated = await apiFetch<{
          id: string
          name: string
          description?: string | null
          cover_image_url?: string | null
        }>(`/api/v1/weddings/${editingAlbum.weddingId}/albums/${editingAlbum.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            cover_image: formCover || null,
            download_enabled: formDownloadEnabled,
          }),
        })
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === editingAlbum.id
              ? {
                  ...a,
                  name: updated.name,
                  description: updated.description || undefined,
                  coverImageUrl: updated.cover_image_url || undefined,
                }
              : a
          )
        )
        toast({ title: 'Album updated', variant: 'success' })
      } else {
        const created = await apiFetch<{
          id: string
          wedding_id: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          photo_count: number
          sort_order: number
          created_at: string
        }>(`/api/v1/weddings/${formWeddingId}/albums/`, {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            download_enabled: formDownloadEnabled,
          }),
        })
        if (formCover) {
          const withCover = await apiFetch<{
            id: string
            cover_image_url?: string | null
          }>(`/api/v1/weddings/${formWeddingId}/albums/${created.id}`, {
            method: 'PUT',
            body: JSON.stringify({ cover_image: formCover }),
          })
          created.cover_image_url = withCover.cover_image_url
        }
        setAlbums((prev) => [...prev, mapAlbum(created)])
        toast({ title: 'Album created', variant: 'success' })
      }
    } catch {
      toast({ title: editingAlbum ? 'Failed to update album' : 'Failed to create album', variant: 'error' })
    } finally {
      setAlbumModalOpen(false)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Albums' }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Albums</h1>
            <p className="mt-1 text-sm text-muted">Manage photo albums ({albums.length} total)</p>
          </div>
          <Button onClick={openCreate}>
            <Icon name="plus" size={16} />
            New Album
          </Button>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search albums..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Icon name="search" size={16} />}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="images"
            title="No albums found"
            description={search ? 'Try a different search term' : 'Create your first album to get started'}
            action={
              !search ? (
                <Button onClick={openCreate}>
                  <Icon name="plus" size={16} />
                  New Album
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((album, i) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card hover className="group overflow-hidden p-0" onClick={() => openView(album)}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]">
                    {album.coverImageUrl ? (
                      <img
                        src={mediaUrl(album.coverImageUrl)}
                        alt={album.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon name="images" size={32} className="text-gold/40" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate">{album.name}</CardTitle>
                        {album.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{album.description}</p>
                        )}
                      </div>

                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="more-vertical" size={16} />
                          </button>
                        }
                        items={[
                          {
                            label: 'Edit',
                            value: 'edit',
                            icon: <Icon name="edit" size={16} />,
                            onClick: () => openEdit(album),
                          },
                          {
                            label: 'Delete',
                            value: 'delete',
                            icon: <Icon name="trash" size={16} />,
                            danger: true,
                            onClick: () => {
                              setViewingAlbum(album)
                              setDeleteConfirmOpen(true)
                            },
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Icon name="images" size={12} />
                        {album.photoCount} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="folder" size={12} />
                        {getWeddingName(album.weddingId)}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        title={editingAlbum ? 'Edit Album' : 'New Album'}
        description={editingAlbum ? 'Update the album details.' : 'Create a new photo album.'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Album Name"
            placeholder="e.g. Ceremony, Reception..."
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief description of the album"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Select
            label="Wedding"
            options={weddings.map((w) => ({
              label: w.weddingName,
              value: w.id,
            }))}
            value={formWeddingId}
            onChange={(e) => setFormWeddingId(e.target.value)}
          />
          <Switch
            checked={formDownloadEnabled}
            onChange={setFormDownloadEnabled}
            label="Allow customers to download this album"
          />
          <div className="rounded-lg border border-dashed border-border bg-white/5 p-4">
            <p className="mb-3 text-center text-xs text-muted">Album Cover</p>
            {formCover ? (
              <div className="relative">
                <img
                  src={mediaUrl(formCover)}
                  alt="Cover"
                  className="h-28 w-full rounded-md object-cover"
                />
                <button
                  onClick={() => setFormCover('')}
                  className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md bg-white/[0.02]">
                <Icon name="images" size={24} className="text-muted" />
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={openCoverPicker}>
                <Icon name="image" size={13} />
                Pick from photos
              </Button>
            </div>
          </div>

          <Modal
            open={coverPickerOpen}
            onClose={() => setCoverPickerOpen(false)}
            title="Choose Cover Photo"
            description="Select a photo from the wedding gallery."
            size="full"
            className="max-h-[80vh] overflow-y-auto"
          >
            {coverLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
            ) : coverPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="image" size={28} className="text-muted" />
                <p className="mt-3 text-sm text-muted">No photos in this wedding yet</p>
                <p className="mt-1 text-xs text-muted">Upload photos first, then pick a cover.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {coverPhotos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFormCover(p.src)
                      setCoverPickerOpen(false)
                    }}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-white/5"
                  >
                    {p.src ? (
                      <img
                        src={mediaUrl(p.src)}
                        alt={p.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon name="image" size={20} className="text-muted" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Modal>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAlbumModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !formWeddingId}>
              {editingAlbum ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={viewingAlbum?.name || 'Album'}
        description={viewingAlbum?.description ?? undefined}
        size="full"
        className="max-h-[90vh] overflow-y-auto"
      >
        {viewingAlbum && (
          <div>
            <div className="mb-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                {getWeddingName(viewingAlbum.weddingId)} &middot; {viewingAlbum.photoCount} photos
              </span>
              {viewingAlbum.coverImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={coverUpdating}
                  onClick={clearCover}
                >
                  <Icon name="trash" size={14} />
                  Remove cover
                </Button>
              )}
            </div>

            {viewLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
            ) : viewingPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="image" size={28} className="text-muted" />
                <p className="mt-3 text-sm text-muted">No photos in this album yet</p>
                <p className="mt-1 text-xs text-muted">
                  Assign photos from the gallery, then pick one as the cover.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {viewingPhotos.map((p) => {
                  const isCover = viewingAlbum.coverImageUrl === p.src
                  return (
                    <div
                      key={p.id}
                      className={`group relative overflow-hidden rounded-lg border bg-white/5 ${
                        isCover ? 'border-gold' : 'border-border/50'
                      }`}
                    >
                      <img
                        src={mediaUrl(p.src)}
                        alt={p.alt}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <button
                        disabled={coverUpdating}
                        onClick={() => setCover(p)}
                        className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
                      >
                        <Icon name="image" size={12} />
                        Set as cover
                      </button>
                      {isCover && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-gold px-2 py-1 text-[11px] font-medium text-black">
                          <Icon name="check" size={12} />
                          Cover
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Album"
        description={`Are you sure you want to delete "${viewingAlbum?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </AuthGuard>
  )
}
