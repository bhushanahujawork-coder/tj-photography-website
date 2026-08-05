'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dropdown } from '@/components/ui/dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Album, Wedding } from '@/types/platform'

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
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formWeddingId, setFormWeddingId] = useState('')

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
    setAlbumModalOpen(true)
  }

  function openEdit(album: Album) {
    setEditingAlbum(album)
    setFormName(album.name)
    setFormDescription(album.description || '')
    setFormWeddingId(album.weddingId)
    setAlbumModalOpen(true)
  }

  function openView(album: Album) {
    setViewingAlbum(album)
    setViewModalOpen(true)
  }

  function handleDelete() {
    if (!viewingAlbum) return
    setAlbums((prev) => prev.filter((a) => a.id !== viewingAlbum.id))
    setDeleteConfirmOpen(false)
    toast({ title: 'Album deleted', variant: 'success' })
  }

  function handleSave() {
    if (!formName.trim()) return

    if (editingAlbum) {
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === editingAlbum.id
            ? { ...a, name: formName.trim(), description: formDescription.trim(), weddingId: formWeddingId }
            : a
        )
      )
      toast({ title: 'Album updated', variant: 'success' })
    } else {
      const newAlbum: Album = {
        id: `album-${Date.now()}`,
        weddingId: formWeddingId,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        coverImageUrl: undefined,
        photoCount: 0,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      }
      setAlbums((prev) => [...prev, newAlbum])
      toast({ title: 'Album created', variant: 'success' })
    }

    setAlbumModalOpen(false)
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
                        src={album.coverImageUrl}
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
          <div className="rounded-lg border border-dashed border-border bg-white/5 p-6 text-center">
            <Icon name="upload" size={20} className="mx-auto text-muted" />
            <p className="mt-2 text-xs text-muted">Cover image upload coming soon</p>
          </div>
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
            <div className="mb-4 text-sm text-muted">
              {getWeddingName(viewingAlbum.weddingId)} &middot; {viewingAlbum.photoCount} photos
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="image" size={28} className="text-muted" />
              <p className="mt-3 text-sm text-muted">No photos in this album yet</p>
            </div>
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
