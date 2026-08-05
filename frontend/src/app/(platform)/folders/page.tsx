'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Folder, GalleryVisibility } from '@/types/platform'

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Hidden', value: 'hidden' },
]

const visibilityBadgeVariant: Record<string, 'success' | 'default' | 'warning'> = {
  public: 'success',
  private: 'default',
  hidden: 'warning',
}

export default function FoldersPage() {
  const { toast } = useToast()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [folderName, setFolderName] = useState('')
  const [folderVisibility, setFolderVisibility] = useState<GalleryVisibility>('private')

  useEffect(() => {
    apiFetch<{ weddings: { id: string }[] }>('/api/v1/weddings?page_size=100')
      .then(async res => {
        const weddings = res.weddings ?? (Array.isArray(res) ? res : [])
        const folderPromises = (weddings as { id: string }[]).map(w =>
          apiFetch<Folder[]>(`/api/v1/weddings/${w.id}/folders`).catch(() => [] as Folder[])
        )
        const results = await Promise.all(folderPromises)
        setFolders(results.flat())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingFolder(null)
    setFolderName('')
    setFolderVisibility('private')
    setModalOpen(true)
  }

  const openRename = (folder: Folder) => {
    setEditingFolder(folder)
    setFolderName(folder.name)
    setFolderVisibility(folder.visibility)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!folderName.trim()) return

    if (editingFolder) {
      setFolders(prev =>
        prev.map(f =>
          f.id === editingFolder.id
            ? { ...f, name: folderName.trim(), visibility: folderVisibility }
            : f
        )
      )
      toast({ title: 'Folder updated', variant: 'success' })
    } else {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        weddingId: 'wed-1',
        name: folderName.trim(),
        photoCount: 0,
        sortOrder: folders.length + 1,
        visibility: folderVisibility,
        createdAt: new Date().toISOString(),
      }
      setFolders(prev => [...prev, newFolder])
      toast({ title: 'Folder created', variant: 'success' })
    }

    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id))
    toast({ title: 'Folder deleted', variant: 'success' })
  }

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Folders' }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (<>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Folders</h1>
            <p className="mt-1 text-sm text-muted">Organize your photos into folders</p>
          </div>
          <Button onClick={openCreate}>
            <Icon name="folder" size={16} />
            New Folder
          </Button>
        </div>

        {folders.length === 0 ? (
          <Card>
            <EmptyState
              icon="folder"
              title="No folders yet"
              description="Create folders to organize your wedding photos."
              action={
                <Button onClick={openCreate}>
                  <Icon name="plus" size={16} />
                  Create Folder
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder, i) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
              >
                <Card hover className="group p-0 overflow-hidden">
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Icon name="folder" size={26} className="text-gold/60" />
                      </div>
                    </div>
                    <div className="absolute right-3 top-3">
                      <Badge variant={visibilityBadgeVariant[folder.visibility]} className="capitalize">
                        {folder.visibility}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-serif text-base text-foreground truncate">{folder.name}</h3>
                      <p className="text-xs text-muted mt-0.5">{folder.photoCount} photos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => openRename(folder)}>
                        <Icon name="edit" size={14} />
                        Rename
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Icon name="arrow-right" size={14} />
                        Move
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(folder.id)}
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </>)}
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFolder ? 'Rename Folder' : 'New Folder'}
        description={editingFolder ? 'Update the folder name and visibility.' : 'Create a new folder for your photos.'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="e.g. Ceremony, Reception, Details..."
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
          />
          <Select
            label="Visibility"
            options={visibilityOptions}
            value={folderVisibility}
            onChange={e => setFolderVisibility(e.target.value as GalleryVisibility)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!folderName.trim()}>
              {editingFolder ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  )
}
