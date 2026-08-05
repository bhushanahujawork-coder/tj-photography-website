'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { DownloadRecord } from '@/types/platform'

const statusBadge: Record<string, 'success' | 'warning' | 'error'> = {
  completed: 'success',
  processing: 'warning',
  failed: 'error',
}

const typeColors: Record<string, string> = {
  single: 'text-blue-400',
  multiple: 'text-purple-400',
  bulk: 'text-orange-400',
  zip: 'text-gold',
}

export default function DownloadsPage() {
  const [records, setRecords] = useState<DownloadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch<{ items: DownloadRecord[] }>('/api/v1/downloads/?page_size=50')
      .then(data => setRecords(data.items))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter(r => r.weddingName.toLowerCase().includes(q))
  }, [search, records])

  const columns = [
    {
      key: 'wedding',
      header: 'Wedding',
      render: (item: DownloadRecord) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Icon name="heart" size={14} className="text-gold" />
          </div>
          <span className="font-medium text-foreground">{item.weddingName}</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (item: DownloadRecord) => (
        <span className="text-foreground">{item.userName}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: DownloadRecord) => (
        <span className={cn('text-sm font-medium capitalize', typeColors[item.type] || 'text-muted')}>
          {item.type}
        </span>
      ),
    },
    {
      key: 'photos',
      header: 'Photos',
      render: (item: DownloadRecord) => (
        <span className="text-foreground">{item.photoCount}</span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item: DownloadRecord) => (
        <span className="text-muted">{item.totalSize}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: DownloadRecord) => (
        <span className="text-muted">{formatDate(item.createdAt, 'relative')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: DownloadRecord) => (
        <Badge variant={statusBadge[item.status] || 'default'}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      ),
    },
  ]

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Downloads' }]} />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Downloads</h1>
              <p className="mt-1 text-sm text-muted">Track and manage download requests</p>
            </div>
            <Button>
              <Icon name="plus" size={16} />
              New Download Request
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <div className="border-b border-border px-4 py-3">
              <Input
                placeholder="Search by wedding name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={<Icon name="search" size={16} />}
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
            ) : filtered.length > 0 ? (
              <Table columns={columns} data={filtered} />
            ) : (
              <EmptyState
                icon="download"
                title="No downloads found"
                description={search ? 'Try adjusting your search terms' : 'No download records available'}
              />
            )}
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  )
}
