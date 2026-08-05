'use client'

import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn, formatDate, pluralize } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dropdown } from '@/components/ui/dropdown'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ShareLinkModal } from '@/components/platform/share-link-modal'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { AuthGuard } from '@/components/platform/auth-guard'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Wedding } from '@/types/platform'
import { useRouter } from 'next/navigation'

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  draft: 'warning',
  archived: 'error',
}

const visibilityIcon: Record<string, string> = {
  public: 'globe',
  private: 'lock',
  hidden: 'eye-off',
}

export default function WeddingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const router = useRouter()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    apiFetch<Wedding>(`/api/v1/weddings/${id}`)
      .then(data => setWedding(data))
      .catch(() => setWedding(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
        </div>
      </AuthGuard>
    )
  }

  if (!wedding) {
    return (
      <AuthGuard>
        <div className="flex h-96 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Icon name="alert-circle" size={28} className="text-muted" />
          </div>
          <h2 className="font-serif text-lg text-foreground">Wedding not found</h2>
          <p className="mt-1 text-sm text-muted">This wedding doesn't exist or has been removed.</p>
          <Link href="/weddings">
            <Button className="mt-6" variant="outline" size="sm">
              <Icon name="arrow-left" size={16} />
              Back to Weddings
            </Button>
          </Link>
        </div>
      </AuthGuard>
    )
  }

  const infoItems = [
    { label: 'Bride', value: wedding.brideName },
    { label: 'Groom', value: wedding.groomName },
    { label: 'Date', value: formatDate(wedding.weddingDate, 'long') },
    { label: 'Location', value: wedding.location },
    { label: 'Code', value: wedding.weddingCode },
    { label: 'Visibility', value: wedding.visibility.charAt(0).toUpperCase() + wedding.visibility.slice(1), icon: visibilityIcon[wedding.visibility] },
    { label: 'Created', value: formatDate(wedding.createdAt, 'short') },
  ]

  const statCards = [
    { label: 'Total Photos', value: wedding.totalPhotos, icon: 'image' },
    { label: 'Albums', value: wedding.totalAlbums, icon: 'images' },
    { label: 'Folders', value: wedding.totalFolders, icon: 'folder' },
  ]

  const handleDelete = () => {
    setWedding(null)
    toast({ title: 'Wedding deleted', variant: 'success' })
    router.push('/weddings')
  }

  const handlePublish = () => {
    setWedding(prev => prev ? { ...prev, status: 'active' as const } : prev)
    toast({ title: 'Gallery published', description: 'Your wedding gallery is now live', variant: 'success' })
  }

  return (
    <AuthGuard>
      <div>
        <Breadcrumb items={[
          { label: 'Weddings', href: '/weddings' },
          { label: wedding.weddingName },
        ]} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-serif text-2xl text-foreground">{wedding.weddingName}</h1>
                <p className="text-sm text-muted mt-1">{wedding.brideName} & {wedding.groomName}</p>
              </div>
              <Badge variant={statusVariant[wedding.status] || 'default'}>
                {wedding.status.charAt(0).toUpperCase() + wedding.status.slice(1)}
              </Badge>
            </div>
            <Dropdown
              align="right"
              trigger={
                <Button variant="outline" size="sm">
                  <Icon name="more-vertical" size={16} />
                </Button>
              }
              items={[
                { label: 'Edit', value: 'edit', icon: <Icon name="edit" size={14} /> },
                { label: 'Duplicate', value: 'duplicate', icon: <Icon name="copy-plus" size={14} /> },
                { label: 'Archive', value: 'archive', icon: <Icon name="archive" size={14} /> },
                { label: 'Delete', value: 'delete', icon: <Icon name="trash" size={14} />, danger: true, onClick: () => setDeleteOpen(true) },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.label} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <Icon name={stat.icon} size={22} className="text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardTitle>Wedding Information</CardTitle>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-xs text-muted uppercase tracking-wider">{item.label}</p>
                    <p className="flex items-center gap-1.5 text-sm text-foreground">
                      {item.icon && <Icon name={item.icon} size={14} className="text-muted" />}
                      {item.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardTitle>Wedding Workflow</CardTitle>
              <CardContent className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  {[
                    { label: 'Create Wedding', done: true, href: '' },
                    { label: 'Upload Photos', done: wedding.totalPhotos > 0, href: `/upload` },
                    { label: 'Create Albums', done: wedding.totalAlbums > 0, href: `/albums` },
                    { label: 'Create Folders', done: wedding.totalFolders > 0, href: `/folders` },
                    { label: 'Publish Gallery', done: wedding.status === 'active', action: handlePublish },
                    { label: 'Share Gallery', done: false, action: () => setShareOpen(true) },
                    { label: 'Invite Participants', done: false, href: '/participants' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        step.done ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-muted'
                      }`}>
                        {step.done ? (
                          <Icon name="check" size={12} />
                        ) : (
                          <span className="text-[10px] font-medium">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm flex-1 ${step.done ? 'text-muted line-through' : 'text-foreground'}`}>
                        {step.label}
                      </span>
                      {step.href && !step.done && (
                        <Link href={step.href}>
                          <Button variant="ghost" size="sm" className="text-gold">Go</Button>
                        </Link>
                      )}
                      {step.action && !step.done && (
                        <Button variant="ghost" size="sm" className="text-gold" onClick={step.action}>Go</Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/weddings/${id}/gallery`}>
              <Button>
                <Icon name="image" size={16} />
                Open Gallery
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="secondary">
                <Icon name="upload" size={16} />
                Upload Photos
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Icon name="share" size={16} />
              Share Gallery
            </Button>
            <Link href="/participants">
              <Button variant="secondary">
                <Icon name="user-plus" size={16} />
                Invite Participants
              </Button>
            </Link>
            <Button variant="secondary">
              <Icon name="download" size={16} />
              Download All
            </Button>
          </div>
        </motion.div>
      </div>

      <ShareLinkModal open={shareOpen} onClose={() => setShareOpen(false)} weddingId={id} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Wedding"
        description={`Are you sure you want to delete "${wedding.weddingName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </AuthGuard>
  )
}
