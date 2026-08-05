'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { ActivityLog } from '@/types/platform'

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Uploads', value: 'upload' },
  { label: 'Downloads', value: 'download' },
  { label: 'Shares', value: 'share' },
  { label: 'Edits', value: 'edit' },
  { label: 'Invites', value: 'invite' },
] as const

const typeConfig: Record<string, { icon: string; color: string }> = {
  upload: { icon: 'upload', color: 'text-blue-400 bg-blue-500/10' },
  download: { icon: 'download', color: 'text-green-400 bg-green-500/10' },
  share: { icon: 'share', color: 'text-purple-400 bg-purple-500/10' },
  edit: { icon: 'edit', color: 'text-yellow-400 bg-yellow-500/10' },
  delete: { icon: 'trash', color: 'text-red-400 bg-red-500/10' },
  create: { icon: 'plus', color: 'text-emerald-400 bg-emerald-500/10' },
  login: { icon: 'user-plus', color: 'text-cyan-400 bg-cyan-500/10' },
  invite: { icon: 'user-plus', color: 'text-orange-400 bg-orange-500/10' },
}

const breadcrumbItems = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Activity Logs' }]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>('all')
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ items: ActivityLog[] }>('/api/v1/activity/?page_size=50')
      .then(data => setLogs(data.items))
      .finally(() => setLoading(false))
  }, [])

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter(log => log.type === filter)
  }, [filter, logs])

  return (
    <AuthGuard>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Activity Logs</h1>
              <p className="mt-1 text-sm text-muted">Track all actions and events across your galleries</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map(opt => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No activity found"
            description="No logs match the selected filter. Try a different filter."
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative"
          >
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {filteredLogs.map((log, i) => {
                const config = typeConfig[log.type] || { icon: 'info', color: 'text-muted bg-white/5' }
                return (
                  <motion.div key={log.id} variants={itemVariants}>
                    <Card className="relative ml-14">
                      <div className="absolute -left-14 top-6 flex items-center justify-center">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 border-background', config.color)}>
                          <Icon name={config.icon} size={16} />
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-medium text-gold">
                          {getInitials(log.userName || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{log.userName}</span>
                            <span className="text-muted">{log.action}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted">{log.description}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                            <span>{formatDate(log.createdAt, 'relative')}</span>
                          </div>
                        </div>
                        <Badge variant={log.type === 'delete' ? 'error' : log.type === 'upload' ? 'success' : 'default'}>
                          {log.type}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AuthGuard>
  )
}
