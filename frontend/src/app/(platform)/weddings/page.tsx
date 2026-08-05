'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dropdown } from '@/components/ui/dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Wedding, WeddingStatus } from '@/types/platform'

const statusColors: Record<WeddingStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  archived: 'warning',
  draft: 'default',
}

const tabs = ['All', 'Active', 'Archived', 'Draft'] as const

export default function WeddingsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('All')
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeddings()
  }, [])

  async function loadWeddings() {
    setLoading(true)
    try {
      const data = await apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
      setWeddings(data.items || [])
    } catch {
      setWeddings([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return weddings.filter((w) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        w.weddingName.toLowerCase().includes(q) ||
        w.brideName.toLowerCase().includes(q) ||
        w.groomName.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q) ||
        w.weddingCode.toLowerCase().includes(q)

      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Active' && w.status === 'active') ||
        (activeTab === 'Archived' && w.status === 'archived') ||
        (activeTab === 'Draft' && w.status === 'draft')

      return matchesSearch && matchesTab
    })
  }, [search, activeTab, weddings])

  async function toggleArchive(id: string) {
    const wedding = weddings.find((w) => w.id === id)
    if (!wedding) return
    const isArchived = wedding.status === 'archived'
    try {
      if (isArchived) {
        await apiFetch(`/api/v1/weddings/${id}/publish`, {
          method: 'POST',
          body: JSON.stringify({ action: 'publish' }),
        })
      } else {
        await apiFetch(`/api/v1/weddings/${id}/archive`, { method: 'POST' })
      }
      await loadWeddings()
      toast({ title: isArchived ? 'Wedding restored' : 'Wedding archived', variant: 'success' })
    } catch (e) {
      const msg = e instanceof ApiError ? e.backendMessage : 'Operation failed'
      toast({ title: 'Error', description: msg, variant: 'error' })
    }
  }

  async function duplicateWedding(id: string) {
    try {
      await apiFetch(`/api/v1/weddings/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      await loadWeddings()
      toast({ title: 'Wedding duplicated', variant: 'success' })
    } catch (e) {
      const msg = e instanceof ApiError ? e.backendMessage : 'Failed to duplicate'
      toast({ title: 'Error', description: msg, variant: 'error' })
    }
  }

  async function deleteWedding(id: string) {
    try {
      await apiFetch(`/api/v1/weddings/${id}`, { method: 'DELETE' })
      await loadWeddings()
      toast({ title: 'Wedding deleted', variant: 'success' })
    } catch (e) {
      const msg = e instanceof ApiError ? e.backendMessage : 'Failed to delete'
      toast({ title: 'Error', description: msg, variant: 'error' })
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Weddings' }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Weddings</h1>
            <p className="mt-1 text-sm text-muted">
              Manage your wedding galleries ({weddings.length} total)
            </p>
          </div>
          <Link href="/weddings/new">
            <Button>
              <Icon name="plus" size={16} />
              New Wedding
            </Button>
          </Link>
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
              placeholder="Search weddings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Icon name="search" size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="refresh" size={24} className="animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="image"
            title="No weddings found"
            description={search ? 'Try a different search term' : 'Create your first wedding to get started'}
            action={
              !search ? (
                <Link href="/weddings/new">
                  <Button>
                    <Icon name="plus" size={16} />
                    New Wedding
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((wedding, i) => (
              <motion.div
                key={wedding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden p-0">
                  <Link href={`/weddings/${wedding.id}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
                      {wedding.coverImageUrl ? (
                        <img
                          src={wedding.coverImageUrl}
                          alt={wedding.weddingName}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Icon name="image" size={32} className="text-muted/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <Badge variant={statusColors[wedding.status]}>
                          {wedding.status.charAt(0).toUpperCase() + wedding.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/weddings/${wedding.id}`}>
                          <h3 className="truncate font-serif text-base text-foreground transition-colors hover:text-gold">
                            {wedding.weddingName}
                          </h3>
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {wedding.brideName} & {wedding.groomName}
                        </p>
                      </div>

                      <Dropdown
                        align="right"
                        trigger={
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground">
                            <Icon name="more-vertical" size={16} />
                          </button>
                        }
                        items={[
                          {
                            label: 'View',
                            value: 'view',
                            icon: <Icon name="eye" size={16} />,
                            onClick: () => {},
                          },
                          {
                            label: 'Duplicate',
                            value: 'duplicate',
                            icon: <Icon name="copy-plus" size={16} />,
                            onClick: () => duplicateWedding(wedding.id),
                          },
                          {
                            label: wedding.status === 'archived' ? 'Unarchive' : 'Archive',
                            value: 'archive',
                            icon: <Icon name="archive" size={16} />,
                            onClick: () => toggleArchive(wedding.id),
                          },
                          {
                            label: 'Delete',
                            value: 'delete',
                            icon: <Icon name="trash" size={16} />,
                            danger: true,
                            onClick: () => deleteWedding(wedding.id),
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <Icon name="calendar" size={12} />
                        <span>{formatDate(wedding.weddingDate, 'long')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="globe" size={12} />
                        <span className="truncate">{wedding.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="lock" size={12} />
                        <span className="font-mono text-foreground/60">{wedding.weddingCode}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Icon name="images" size={12} />
                        {wedding.totalPhotos} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="folder" size={12} />
                        {wedding.totalAlbums} albums
                      </span>
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
