'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/lib/icons'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from '@/lib/api'
import type { ShareLink, Wedding } from '@/types/platform'

const roleOptions = [
  { label: 'Client', value: 'client' },
  { label: 'Guest', value: 'guest' },
  { label: 'Editor', value: 'editor' },
]

interface ShareLinkModalProps {
  open: boolean
  onClose: () => void
  weddingId?: string
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function ShareLinkModal({ open, onClose, weddingId: preFilledWeddingId }: ShareLinkModalProps) {
  const { toast } = useToast()
  const [weddingId, setWeddingId] = useState(preFilledWeddingId || '')
  const [role, setRole] = useState('client')
  const [downloadEnabled, setDownloadEnabled] = useState(true)
  const [expiryDate, setExpiryDate] = useState('')
  const [pin, setPin] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [linksByWedding, setLinksByWedding] = useState<Record<string, ShareLink[]>>({})
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const activeWeddingId = preFilledWeddingId || weddingId
  const links = activeWeddingId ? (linksByWedding[activeWeddingId] ?? []) : []

  const updateLinks = (wid: string, updater: (prev: ShareLink[]) => ShareLink[]) =>
    setLinksByWedding(prev => ({ ...prev, [wid]: updater(prev[wid] ?? []) }))

  useEffect(() => {
    if (!open || preFilledWeddingId) return
    apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
      .then(data => setWeddings(data.items || []))
      .catch(() => {})
  }, [open, preFilledWeddingId])

  useEffect(() => {
    if (!open || !activeWeddingId) return
    apiFetch<ShareLink[]>(`/api/v1/weddings/${activeWeddingId}/share-links`)
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setLinksByWedding(prev => ({ ...prev, [activeWeddingId]: list }))
      })
      .catch(() => {})
  }, [open, activeWeddingId])

  const weddingOptions = weddings.map(w => ({ label: w.weddingName, value: w.id }))

  const handleGenerate = async () => {
    if (!activeWeddingId) {
      toast({ title: 'Please select a wedding', variant: 'warning' })
      return
    }

    const trimmedPin = pin.trim()
    if (trimmedPin && !/^\d{4,6}$/.test(trimmedPin)) {
      toast({ title: 'PIN must be 4-6 digits', variant: 'warning' })
      return
    }

    setGenerating(true)
    try {
      const created = await apiFetch<ShareLink>(`/api/v1/weddings/${activeWeddingId}/share-links`, {
        method: 'POST',
        body: JSON.stringify({
          wedding_id: activeWeddingId,
          role,
          download_enabled: downloadEnabled,
          pin_code: trimmedPin || undefined,
          expires_at: expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : undefined,
        }),
      })
      const url = absoluteUrl(created.url)
      updateLinks(activeWeddingId, prev => [created, ...prev])
      setGeneratedLink(url)
      setCopied(false)
      setPin('')
      toast({ title: 'Share link created', variant: 'success' })
    } catch (err) {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to create share link',
        variant: 'error',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (link: ShareLink) => {
    setDeletingId(link.id)
    try {
      await apiFetch(`/api/v1/share-links/${link.id}`, { method: 'DELETE' })
      updateLinks(link.weddingId, prev => prev.filter(l => l.id !== link.id))
      toast({ title: 'Share link deleted', variant: 'success' })
    } catch (err) {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to delete share link',
        variant: 'error',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: 'Link copied to clipboard', variant: 'success' })
    } catch {
      toast({ title: 'Failed to copy link', variant: 'error' })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Gallery" size="lg">
      <div className="space-y-6">
        {!preFilledWeddingId && (
          <Select
            label="Wedding"
            placeholder="Select a wedding"
            options={weddingOptions}
            value={weddingId}
            onChange={e => { setWeddingId(e.target.value); setGeneratedLink(null) }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Access Role"
            options={roleOptions}
            value={role}
            onChange={e => setRole(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Expiry Date (optional)</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <Input
          label="Gallery PIN (optional)"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="4-6 digit PIN"
          inputMode="numeric"
          maxLength={6}
        />

        <Switch
          checked={downloadEnabled}
          onChange={setDownloadEnabled}
          label="Enable downloads for recipients"
        />

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || !activeWeddingId}
          loading={generating}
        >
          <Icon name="link" size={16} />
          Generate Share Link
        </Button>

        {generatedLink && (
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 truncate">
                <p className="text-xs text-muted mb-1">Share Link</p>
                <p className="font-mono text-sm text-foreground">{generatedLink}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(generatedLink)}>
                <Icon name={copied ? 'check' : 'copy'} size={16} />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted">Existing Share Links</h4>
            {links.map(link => {
              const url = absoluteUrl(link.url)
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-foreground">{url}</p>
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs capitalize text-muted">
                        {link.role}
                      </span>
                      {link.pinCode && (
                        <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">
                          PIN
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                      <span>Created {formatDate(link.createdAt)}</span>
                      <span>{link.accessCount} access{link.accessCount !== 1 ? 'es' : ''}</span>
                      {link.downloadEnabled && <span className="text-green-400">Downloads enabled</span>}
                      {link.expiresAt && <span>Expires {formatDate(link.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(url)}
                      aria-label="Copy share link"
                    >
                      <Icon name="copy" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(link)}
                      loading={deletingId === link.id}
                      aria-label="Delete share link"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
