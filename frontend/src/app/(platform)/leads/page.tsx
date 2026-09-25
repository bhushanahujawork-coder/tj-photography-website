'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import {
  fetchLeads,
  getQuotationConfig,
  updateLeadStatus,
  type QuotationConfig,
  type QuotationLead,
} from '@/lib/api-quotation'
import { formatINR } from '@/lib/quotation-calc'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, type Column } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Dropdown } from '@/components/ui/dropdown'
import { Icon } from '@/lib/icons'
import { useToast } from '@/hooks/use-toast'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  NEW: 'info',
  QUOTATION_GENERATED: 'default',
  CONTACTED: 'warning',
  FOLLOW_UP: 'warning',
  BOOKED: 'success',
  LOST: 'error',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function LeadsPage() {
  return (
    <AuthGuard roles={['admin', 'photographer']}>
      <LeadsContent />
    </AuthGuard>
  )
}

function LeadsContent() {
  const { toast } = useToast()
  const [config, setConfig] = useState<QuotationConfig | null>(null)
  const [leads, setLeads] = useState<QuotationLead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [event, setEvent] = useState('')

  useEffect(() => {
    getQuotationConfig().then(setConfig).catch(() => {})
  }, [])

  const load = useCallback(() => {
    return fetchLeads({
      status: status || undefined,
      event: event || undefined,
      search: search || undefined,
    })
      .then((data) => {
        setLeads(data.items)
        setTotal(data.total)
      })
      .catch((err: unknown) => {
        toast({
          title: 'Could not load leads',
          description: err instanceof ApiError ? err.backendMessage : undefined,
          variant: 'error',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [status, event, search, toast])

  useEffect(() => {
    load()
  }, [load])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleStatusChange = async (lead: QuotationLead, next: string) => {
    try {
      const updated = await updateLeadStatus(lead.id, next)
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)))
      toast({ title: 'Lead updated', description: `Status → ${next.replace(/_/g, ' ')}`, variant: 'success' })
    } catch (err: unknown) {
      toast({
        title: 'Update failed',
        description: err instanceof ApiError ? err.backendMessage : undefined,
        variant: 'error',
      })
    }
  }

  const eventLabel = (value?: string | null) => {
    if (!value) return '—'
    const match = config?.eventTypes.find((t) => t.value === value)
    return match?.label ?? value
  }

  const columns: Column<QuotationLead>[] = [
    {
      key: 'phone',
      header: 'Phone',
      render: (lead) => (
        <div>
          <p className="font-medium text-foreground">+91 {lead.phone}</p>
          <p className="text-xs text-muted">{formatDate(lead.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'couple',
      header: 'Couple',
      render: (lead) => (
        <div>
          <p className="text-foreground">{lead.coupleName || '—'}</p>
          {lead.eventDate && <p className="text-xs text-muted">{lead.eventDate}</p>}
        </div>
      ),
    },
    {
      key: 'event',
      header: 'Event',
      render: (lead) =>
        lead.eventType ? (
          <Badge variant={lead.eventType === 'wedding' ? 'info' : 'default'}>
            {eventLabel(lead.eventType)}
          </Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'package',
      header: 'Package',
      render: (lead) =>
        lead.packageName ? (
          <div>
            <p className="text-foreground">{lead.packageName}</p>
            {typeof lead.quotationTotal === 'number' && (
              <p className="text-xs font-medium text-gold">{formatINR(lead.quotationTotal)}</p>
            )}
          </div>
        ) : (
          <span className="text-muted">No quotation yet</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => (
        <Badge variant={statusVariant[lead.status] ?? 'default'}>
          {lead.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (lead) => (
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Update lead status"
            >
              <Icon name="more-vertical" size={16} />
            </button>
          }
          items={(config?.leadStatuses ?? ['NEW', 'QUOTATION_GENERATED', 'CONTACTED', 'FOLLOW_UP', 'BOOKED', 'LOST']).map(
            (s) => ({
              label: s.replace(/_/g, ' '),
              value: s,
              onClick: () => handleStatusChange(lead, s),
            }),
          )}
        />
      ),
    },
  ]

  const statusOptions = [
    { label: 'All statuses', value: '' },
    ...(config?.leadStatuses ?? []).map((s) => ({ label: s.replace(/_/g, ' '), value: s })),
  ]

  const eventOptions = [
    { label: 'All events', value: '' },
    ...(config?.eventTypes ?? []).map((t) => ({ label: t.label, value: t.value })),
  ]

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leads' }]} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Leads</h1>
          <p className="text-sm text-muted">
            Enquiries from the /quote quotation builder
            {total > 0 && ` · ${total} lead${total > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true)
            load()
          }}
        >
          <Icon name="refresh" size={14} className="mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-56 flex-1">
            <Input
              label="Search"
              placeholder="Phone or couple name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Icon name="search" size={14} />}
            />
          </div>
          <div className="w-44">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              label="Event"
              options={eventOptions}
              value={event}
              onChange={(e) => setEvent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon="phone"
          title="No leads yet"
          description="Quotations generated on /quote will appear here."
        />
      ) : (
        <Table columns={columns} data={leads} />
      )}
    </div>
  )
}
