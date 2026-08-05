'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Wedding, WeddingStatus } from '@/types/platform'

const statusColors: Record<WeddingStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  archived: 'warning',
  draft: 'default',
}

const tabs = ['All', 'Active', 'Archived', 'Draft'] as const

export default function GalleryPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('All')
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
      .then(data => setWeddings(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return weddings.filter((w) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        w.weddingName.toLowerCase().includes(q) ||
        w.brideName.toLowerCase().includes(q) ||
        w.groomName.toLowerCase().includes(q) ||
        w.weddingCode.toLowerCase().includes(q)

      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Active' && w.status === 'active') ||
        (activeTab === 'Archived' && w.status === 'archived') ||
        (activeTab === 'Draft' && w.status === 'draft')

      return matchesSearch && matchesTab
    })
  }, [search, activeTab])

  function handleShare(weddingName: string) {
    navigator.clipboard?.writeText(window.location.origin + '/gallery')
    toast({ title: `Share link copied for ${weddingName}`, variant: 'success' })
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Gallery' }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Gallery</h1>
            <p className="mt-1 text-sm text-muted">
              Browse all wedding galleries ({weddings.length} total)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-gold text-black'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search galleries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Icon name="search" size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="image"
            title="No galleries found"
            description={search ? 'Try a different search term' : 'No wedding galleries available'}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((wedding, i) => (
              <motion.div
                key={wedding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden p-0">
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a]">
                    {wedding.coverImageUrl ? (
                      <img
                        src={wedding.coverImageUrl}
                        alt={wedding.weddingName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon name="image" size={32} className="text-gold/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge variant={statusColors[wedding.status]}>
                        {wedding.status.charAt(0).toUpperCase() + wedding.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="truncate font-serif text-base text-foreground">
                      {wedding.weddingName}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {wedding.brideName} & {wedding.groomName}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Icon name="images" size={12} />
                        {wedding.totalPhotos} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="folder" size={12} />
                        {wedding.totalAlbums} albums
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/gallery/${wedding.weddingCode}`}
                        className="flex-1"
                      >
                        <Button variant="primary" size="sm" className="w-full">
                          <Icon name="eye" size={14} />
                          View Gallery
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(wedding.weddingName)}
                      >
                        <Icon name="share" size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
