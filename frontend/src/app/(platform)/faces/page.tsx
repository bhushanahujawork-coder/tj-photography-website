'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch, mediaUrl } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface FaceProfile {
  id: string
  weddingId: string
  photoId: string
  label: string | null
  faceBox: number[] | null
  isPrimary: boolean
  confidence: number | null
  createdAt: string
}

interface PhotoRecord {
  id: string
  src: string
  filename: string
}

interface WeddingOption { id: string; weddingName: string }

interface MatchRecord {
  profile: {
    id: string
    photoId: string
    label: string | null
    isPrimary: boolean
    confidence: number | null
    createdAt: string
  }
  similarity: number
}

function mapFace(f: {
  id: string
  wedding_id: string
  photo_id: string
  label: string | null
  face_box: number[] | null
  is_primary: boolean
  confidence: number | null
  created_at: string
}): FaceProfile {
  return {
    id: f.id,
    weddingId: f.wedding_id,
    photoId: f.photo_id,
    label: f.label,
    faceBox: f.face_box,
    isPrimary: f.is_primary,
    confidence: f.confidence,
    createdAt: f.created_at,
  }
}

export default function FacesPage() {
  const { toast } = useToast()
  const [weddings, setWeddings] = useState<WeddingOption[]>([])
  const [weddingId, setWeddingId] = useState('')
  const [faces, setFaces] = useState<FaceProfile[]>([])
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [facesLoading, setFacesLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerPhotoId, setRegisterPhotoId] = useState('')
  const [registerLabel, setRegisterLabel] = useState('')

  const [editFace, setEditFace] = useState<FaceProfile | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const [deleteFace, setDeleteFace] = useState<FaceProfile | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchFile, setSearchFile] = useState<File | null>(null)
  const [searching, setSearching] = useState(false)
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    apiFetch<{ items: { id: string; wedding_name: string }[] }>('/api/v1/weddings/?page_size=100')
      .then(res => {
        const items = res.items ?? []
        setWeddings(items.map(w => ({ id: w.id, weddingName: w.wedding_name })))
        if (items.length > 0) setWeddingId(prev => prev || items[0].id)
      })
      .catch(() => setWeddings([]))
  }, [])

  useEffect(() => {
    if (!weddingId) return
    let cancelled = false
    Promise.resolve()
      .then(() => {
        setFacesLoading(true)
        setFaces([])
        setPhotos([])
      })
      .then(() => Promise.all([
        apiFetch<Array<{
          id: string
          wedding_id: string
          photo_id: string
          label: string | null
          face_box: number[] | null
          is_primary: boolean
          confidence: number | null
          created_at: string
        }>>(`/api/v1/weddings/${weddingId}/faces`),
        apiFetch<{ items?: Array<{ id: string; medium_url?: string | null; thumbnail_url?: string | null; original_url?: string | null; filename?: string }> }>(
          `/api/v1/weddings/${weddingId}/photos?page_size=200`
        ),
      ]))
      .then(([faceData, photoData]) => {
        if (cancelled) return
        setFaces((faceData || []).map(mapFace))
        setPhotos(
          (photoData?.items || []).map(p => ({
            id: p.id,
            src: p.medium_url || p.thumbnail_url || p.original_url || '',
            filename: p.filename || '',
          }))
        )
      })
      .catch(() => {
        if (cancelled) return
        setFaces([])
        setPhotos([])
      })
      .finally(() => {
        if (!cancelled) setFacesLoading(false)
      })
    return () => { cancelled = true }
  }, [weddingId])

  const photoMap = useMemo(() => new Map(photos.map(p => [p.id, p])), [photos])

  const photoOptions = photos.map(p => ({ label: p.filename || p.id, value: p.id }))

  function openRegister() {
    setRegisterOpen(true)
    setRegisterPhotoId(photos[0]?.id || '')
    setRegisterLabel('')
  }

  async function handleRegister() {
    if (!registerPhotoId) return
    setSaving(true)
    try {
      const created = await apiFetch<{
        id: string
        wedding_id: string
        photo_id: string
        label: string | null
        face_box: number[] | null
        is_primary: boolean
        confidence: number | null
        created_at: string
      }>(`/api/v1/photos/${registerPhotoId}/face`, {
        method: 'POST',
        body: JSON.stringify({ label: registerLabel.trim() || null }),
      })
      setFaces(prev => [...prev, mapFace(created)])
      setRegisterOpen(false)
      toast({ title: 'Face registered', variant: 'success' })
    } catch {
      toast({ title: 'Failed to register face', description: 'Make sure the photo exists on storage', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function openEdit(face: FaceProfile) {
    setEditFace(face)
    setEditLabel(face.label || '')
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editFace) return
    setSaving(true)
    try {
      await apiFetch(`/api/v1/faces/${editFace.id}`, {
        method: 'PUT',
        body: JSON.stringify({ label: editLabel.trim() || null }),
      })
      setFaces(prev =>
        prev.map(f => (f.id === editFace.id ? { ...f, label: editLabel.trim() || null } : f))
      )
      setEditOpen(false)
      toast({ title: 'Face updated', variant: 'success' })
    } catch {
      toast({ title: 'Failed to update face', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSetPrimary(face: FaceProfile) {
    try {
      await apiFetch(`/api/v1/faces/${face.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: true }),
      })
      setFaces(prev => prev.map(f => ({ ...f, isPrimary: f.id === face.id })))
      toast({ title: 'Primary profile set', variant: 'success' })
    } catch {
      toast({ title: 'Failed to set primary', variant: 'error' })
    }
  }

  async function handleDelete() {
    if (!deleteFace) return
    try {
      await apiFetch(`/api/v1/faces/${deleteFace.id}`, { method: 'DELETE' })
      setFaces(prev => prev.filter(f => f.id !== deleteFace.id))
      setDeleteFace(null)
      toast({ title: 'Face deleted', variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete face', variant: 'error' })
    }
  }

  async function handleSearch() {
    if (!searchFile) {
      setSearchError('Please select an image to search')
      return
    }
    setSearching(true)
    setSearchError('')
    setMatches([])
    try {
      const formData = new FormData()
      formData.append('wedding_id', weddingId)
      formData.append('image', searchFile)
      const res = await apiFetch<{ matches?: MatchRecord[] }>('/api/v1/faces/search', {
        method: 'POST',
        body: formData,
      })
      setMatches(res?.matches || [])
    } catch (err) {
      setSearchError(String(err))
    } finally {
      setSearching(false)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Faces (AI)' }]} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Faces (AI)</h1>
            <p className="mt-1 text-sm text-muted">Face profiles for AI matching ({faces.length} registered)</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              label="Wedding"
              placeholder="Select wedding"
              options={weddings.map(w => ({ label: w.weddingName, value: w.id }))}
              value={weddingId}
              onChange={e => setWeddingId(e.target.value)}
              className="w-64"
            />
            <Button onClick={openRegister} disabled={!weddingId || photos.length === 0}>
              <Icon name="user-plus" size={16} />
              Register Face
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSearchOpen(v => !v)}>
            <Icon name="search" size={16} />
            Search Faces
          </Button>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Card>
                <CardContent className="space-y-4">
                  <CardTitle>Search faces</CardTitle>
                  <div className="flex flex-wrap items-end gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setSearchFile(e.target.files?.[0] || null)}
                      className="block w-full max-w-sm text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:text-gold hover:file:bg-white/10 sm:w-auto"
                    />
                    <Button onClick={handleSearch} disabled={!weddingId} loading={searching}>
                      <Icon name="search" size={16} />
                      Search
                    </Button>
                  </div>
                  {searchError && <p className="text-xs text-red-400">{searchError}</p>}
                  {matches.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {matches.map((m, i) => {
                        const src = photoMap.get(m.profile.photoId)?.src || ''
                        return (
                          <div key={`${m.profile.id}-${i}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-white/5 p-3">
                            {src ? (
                              <img src={mediaUrl(src)} alt="" className="h-12 w-12 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/5">
                                <Icon name="user-plus" size={18} className="text-muted" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-foreground">{m.profile.label || 'Unlabeled'}</p>
                              <p className="text-xs text-gold">{Math.round(m.similarity * 100)}% match</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {facesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : faces.length === 0 ? (
          <EmptyState
            icon="user-plus"
            title="No face profiles"
            description={weddingId ? 'Register faces from photos to enable AI matching' : 'Select a wedding to view faces'}
            action={
              weddingId && photos.length > 0 ? (
                <Button onClick={openRegister}>
                  <Icon name="plus" size={16} />
                  Register Face
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {faces.map((face, i) => {
              const src = photoMap.get(face.photoId)?.src || ''
              return (
                <motion.div
                  key={face.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Card hover className="group overflow-hidden p-0">
                    <div className="relative aspect-video h-36 overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]">
                      {src ? (
                        <img src={mediaUrl(src)} alt={face.label || 'Face'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Icon name="user-plus" size={32} className="text-gold/40" />
                        </div>
                      )}
                      <div className="absolute left-2 top-2">
                        <Badge variant={face.isPrimary ? 'success' : 'default'}>
                          {face.isPrimary ? 'Primary' : 'Profile'}
                        </Badge>
                      </div>
                      {face.confidence != null && (
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-gold">
                          {Math.round(face.confidence * 100)}% conf
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="truncate font-medium text-foreground">{face.label || 'Unlabeled'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(face)}>
                          <Icon name="edit" size={13} />
                          Label
                        </Button>
                        {!face.isPrimary && (
                          <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleSetPrimary(face)}>
                            <Icon name="star" size={13} />
                            Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 text-red-400 hover:text-red-300"
                          onClick={() => setDeleteFace(face)}
                        >
                          <Icon name="trash" size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register Face"
        description="Pick a photo where the person is clearly visible."
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Photo"
            options={photoOptions}
            value={registerPhotoId}
            onChange={e => setRegisterPhotoId(e.target.value)}
          />
          <Input
            label="Label (person's name)"
            placeholder="e.g. Neha, Rohan..."
            value={registerLabel}
            onChange={e => setRegisterLabel(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={!registerPhotoId} loading={saving}>
              Register
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Face Label"
        description={editFace?.label || 'Update the label for this face profile.'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Label (person's name)"
            placeholder="e.g. Neha, Rohan..."
            value={editLabel}
            onChange={e => setEditLabel(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editFace} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteFace}
        onClose={() => setDeleteFace(null)}
        onConfirm={handleDelete}
        title="Delete Face Profile"
        description={`Are you sure you want to delete this face profile${deleteFace?.label ? ` for "${deleteFace.label}"` : ''}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </AuthGuard>
  )
}