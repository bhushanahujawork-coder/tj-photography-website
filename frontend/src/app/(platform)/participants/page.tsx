'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Participant, Wedding } from '@/types/platform'

const roleOptions = [
  { label: 'Client', value: 'client' },
  { label: 'Guest', value: 'guest' },
  { label: 'Editor', value: 'editor' },
  { label: 'Photographer', value: 'photographer' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  accepted: 'success',
  pending: 'warning',
  declined: 'error',
}

export default function ParticipantsPage() {
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'phone' | 'email' | 'link'>('email')
  const [inviteValue, setInviteValue] = useState('')
  const [inviteRole, setInviteRole] = useState('guest')
  const [inviteWedding, setInviteWedding] = useState('')

  useEffect(() => {
    apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
      .then(async (data) => {
        setWeddings(data.items)
        if (data.items[0]) {
          setInviteWedding(data.items[0].id)
          const parts = await apiFetch<Participant[]>(`/api/v1/weddings/${data.items[0].id}/participants/`)
          setParticipants(parts)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const weddingMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of weddings) map.set(w.id, w.weddingName)
    return map
  }, [weddings])

  const handleRemove = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
    toast({ title: 'Participant removed', variant: 'success' })
  }

  const handleResend = (_id: string) => {
    toast({ title: 'Invitation resent', description: 'A new invitation has been sent.', variant: 'success' })
  }

  const handleInvite = () => {
    if (!inviteValue.trim()) return

    const newParticipant: Participant = {
      id: `part-${Date.now()}`,
      weddingId: inviteWedding,
      name: inviteMethod === 'link' ? 'Share Link' : inviteValue,
      email: inviteMethod === 'email' ? inviteValue : undefined,
      phone: inviteMethod === 'phone' ? inviteValue : undefined,
      role: inviteRole as Participant['role'],
      status: 'pending',
      invitedAt: new Date().toISOString(),
    }

    setParticipants(prev => [...prev, newParticipant])
    setInviteModal(false)
    setInviteValue('')
    toast({ title: 'Invitation sent', variant: 'success' })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://tjphotography.com/gallery/${inviteWedding}`)
    toast({ title: 'Link copied to clipboard', variant: 'success' })
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (p: Participant) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          {p.email && <p className="text-xs text-muted">{p.email}</p>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (p: Participant) => (
        <Badge variant={p.role === 'client' ? 'info' : p.role === 'editor' ? 'warning' : 'default'}>
          {p.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Participant) => (
        <Badge variant={statusVariant[p.status] || 'default'}>
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'wedding',
      header: 'Wedding',
      render: (p: Participant) => (
        <span className="text-sm text-foreground">{weddingMap.get(p.weddingId) || p.weddingId}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Participant) => (
        <div className="flex items-center gap-2">
          {p.status === 'pending' && (
            <Button variant="ghost" size="sm" onClick={() => handleResend(p.id)}>
              <Icon name="refresh" size={14} />
              Resend
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleRemove(p.id)}>
            <Icon name="trash" size={14} />
            Remove
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Participants' }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Participants</h1>
            <p className="mt-1 text-sm text-muted">Manage wedding participants and invitations</p>
          </div>
          <Button onClick={() => setInviteModal(true)}>
            <Icon name="user-plus" size={16} />
            Invite
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
            </div>
          ) : participants.length === 0 ? (
            <EmptyState
              icon="users"
              title="No participants yet"
              description="Invite participants to collaborate on weddings."
              action={
                <Button onClick={() => setInviteModal(true)}>
                  <Icon name="user-plus" size={16} />
                  Invite Someone
                </Button>
              }
            />
          ) : (
            <Table columns={columns} data={participants} />
          )}
        </Card>
      </motion.div>

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Invite Participant" description="Send an invitation to join the wedding gallery." size="lg">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['email', 'phone', 'link'] as const).map(method => (
              <button
                key={method}
                onClick={() => setInviteMethod(method)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all',
                  inviteMethod === method
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-muted hover:text-foreground'
                )}
              >
                <Icon name={method === 'email' ? 'mail' : method === 'phone' ? 'phone' : 'link'} size={16} />
                {method === 'email' ? 'Email' : method === 'phone' ? 'Phone' : 'Share Link'}
              </button>
            ))}
          </div>

          {inviteMethod === 'link' ? (
            <div className="space-y-3">
              <Select
                label="Wedding"
                options={weddings.map(w => ({ label: w.weddingName, value: w.id }))}
                value={inviteWedding}
                onChange={e => setInviteWedding(e.target.value)}
              />
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted mb-2">Share this link with participants:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-card px-3 py-2 text-sm text-foreground truncate">
                    https://tjphotography.com/gallery/{inviteWedding}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Icon name="copy" size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Wedding"
                options={weddings.map(w => ({ label: w.weddingName, value: w.id }))}
                value={inviteWedding}
                onChange={e => setInviteWedding(e.target.value)}
              />
              <Input
                label={inviteMethod === 'email' ? 'Email Address' : 'Phone Number'}
                type={inviteMethod === 'email' ? 'email' : 'tel'}
                placeholder={inviteMethod === 'email' ? 'participant@example.com' : '+1 (555) 000-0000'}
                value={inviteValue}
                onChange={e => setInviteValue(e.target.value)}
                icon={<Icon name={inviteMethod === 'email' ? 'mail' : 'phone'} size={16} />}
              />
              <Select
                label="Role"
                options={roleOptions}
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setInviteModal(false)}>Cancel</Button>
            {inviteMethod !== 'link' && (
              <Button onClick={handleInvite} disabled={!inviteValue.trim()}>
                Send Invitation
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </AuthGuard>
  )
}
