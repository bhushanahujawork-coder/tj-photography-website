'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/lib/icons'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
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

export function ShareLinkModal({ open, onClose, weddingId: preFilledWeddingId }: ShareLinkModalProps) {
  const { toast } = useToast()
  const [weddingId, setWeddingId] = useState(preFilledWeddingId || '')
  const [role, setRole] = useState('client')
  const [downloadEnabled, setDownloadEnabled] = useState(true)
  const [expiryDate, setExpiryDate] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [weddings, setWeddings] = useState<Wedding[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100'),
      apiFetch<ShareLink[]>('/api/v1/share-links/'),
    ]).then(([wedData, linkData]) => {
      setWeddings(wedData.items || [])
      setLinks(linkData || [])
    }).catch(() => {})
  }, [])

  const weddingOptions = weddings.map(w => ({ label: w.weddingName, value: w.id }))
  const selectedWedding = weddings.find(w => w.id === (preFilledWeddingId || weddingId))
  const weddingLinks = links.filter(l => l.weddingId === (preFilledWeddingId || weddingId))

  const handleGenerate = () => {
    if (!preFilledWeddingId && !weddingId) {
      toast({ title: 'Please select a wedding', variant: 'warning' })
      return
    }

    const id = preFilledWeddingId || weddingId
    const code = `${selectedWedding?.weddingCode || 'SHARE'}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const url = `https://tjphotography.com/gallery/${code}`

    const newLink: ShareLink = {
      id: `sl-${Date.now()}`,
      weddingId: id,
      code,
      url,
      role: role as ShareLink['role'],
      downloadEnabled,
      expiresAt: expiryDate || undefined,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    }

    setLinks(prev => [newLink, ...prev])
    setGeneratedLink(url)
    setCopied(false)
    toast({ title: 'Share link generated', variant: 'success' })
  }

  const handleCopy = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
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

        <Switch
          checked={downloadEnabled}
          onChange={setDownloadEnabled}
          label="Enable downloads for recipients"
        />

        <Button className="w-full" onClick={handleGenerate} disabled={!preFilledWeddingId && !weddingId}>
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
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Icon name={copied ? 'check' : 'copy'} size={16} />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        {weddingLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted">Existing Share Links</h4>
            {weddingLinks.map(link => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm text-foreground">{link.url}</p>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs capitalize text-muted">
                      {link.role}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                    <span>Created {formatDate(link.createdAt)}</span>
                    <span>{link.accessCount} access{link.accessCount !== 1 ? 'es' : ''}</span>
                    {link.downloadEnabled && <span className="text-green-400">Downloads enabled</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link.url)
                      toast({ title: 'Link copied', variant: 'success' })
                    } catch {
                      toast({ title: 'Failed to copy', variant: 'error' })
                    }
                  }}
                >
                  <Icon name="copy" size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
