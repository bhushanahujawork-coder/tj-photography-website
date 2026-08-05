'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { Photo, Wedding } from '@/types/platform'
import { useToast } from '@/hooks/use-toast'

const tabs = [
  { label: 'Client Favorites', value: 'client' },
  { label: 'Admin Favorites', value: 'admin' },
]

export default function FavoritesPage() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('client')

  useEffect(() => {
    apiFetch<{ weddings: Wedding[] }>('/api/v1/weddings?page_size=100')
      .then(async res => {
        const weddings = res.weddings ?? (Array.isArray(res) ? res : [])
        const photoPromises = (weddings as Wedding[]).map(w =>
          apiFetch<{ photos: unknown[] }>(`/api/v1/weddings/${w.id}/photos?page_size=200`)
            .then(r => {
              const items = r.photos ?? (Array.isArray(r) ? r : [])
              return (items as Record<string, unknown>[]).map(p => ({
                id: p.id as string,
                weddingId: p.weddingId as string,
                src: ((p.originalUrl as string) || (p.mediumUrl as string) || (p.thumbnailUrl as string) || '') as string,
                alt: ((p.altText as string) || (p.filename as string) || '') as string,
                width: p.width as number,
                height: p.height as number,
                blurDataURL: p.blurHash as string | undefined,
                favorite: p.favorite as boolean,
                isHighlight: p.isHighlight as boolean,
                createdAt: p.createdAt as string,
                exif: p.exif as Record<string, unknown> | undefined,
                folderId: p.folderId as string | undefined,
                albumId: p.albumId as string | undefined,
              })) as Photo[]
            })
            .catch(() => [] as Photo[])
        )
        const results = await Promise.all(photoPromises)
        setPhotos(results.flat())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const clientFavorites = photos.filter(p => p.favorite)
  const adminFavorites = photos.filter(p => p.isHighlight)

  const favorites = activeTab === 'client' ? clientFavorites : adminFavorites

  const handleExport = () => {
    toast({ title: 'Export started', description: `Exporting ${favorites.length} photos...`, variant: 'success' })
  }

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Favorites' }]} />

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
            <h1 className="font-serif text-3xl text-foreground">Favorites</h1>
            <p className="mt-1 text-sm text-muted">Your most cherished moments</p>
          </div>
          {favorites.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Icon name="download" size={16} />
              Export Favorites
            </Button>
          )}
        </div>

        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-8" />

        {favorites.length === 0 ? (
          <Card>
            <EmptyState
              icon="heart"
              title="No favorites yet"
              description={
                activeTab === 'client'
                  ? 'Clients have not favorited any photos yet.'
                  : 'No admin highlights selected.'
              }
              action={
                <Button variant="outline" onClick={() => setActiveTab(activeTab === 'client' ? 'admin' : 'client')}>
                  View {activeTab === 'client' ? 'Admin' : 'Client'} Favorites
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {favorites.map((photo, i) => (
              <motion.div
                key={photo.id}
                className="break-inside-avoid mb-4 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
              >
                <Card className="overflow-hidden p-0">
                  <div
                    className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]"
                    style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                        <Icon name="image" size={20} className="text-muted/50" />
                      </div>
                    </div>
                    <div className="absolute right-2 top-2">
                      <Icon
                        name="heart"
                        size={16}
                        className={photo.favorite ? 'text-red-400 fill-red-400' : 'text-white/50'}
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted truncate">{photo.alt}</p>
                      {photo.isHighlight && (
                        <Badge variant="info" className="ml-2 flex-shrink-0">Highlight</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted/50">
                      {photo.width} &times; {photo.height}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </>)}
      </motion.div>
    </AuthGuard>
  )
}
