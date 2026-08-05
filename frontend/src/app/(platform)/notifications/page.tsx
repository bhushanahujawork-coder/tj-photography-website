'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn, formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { Notification } from '@/types/platform'
import { useToast } from '@/hooks/use-toast'

const typeConfig: Record<string, { icon: string; color: string }> = {
  info: { icon: 'info', color: 'bg-blue-500/10 text-blue-400' },
  success: { icon: 'check-circle', color: 'bg-green-500/10 text-green-400' },
  warning: { icon: 'warning', color: 'bg-yellow-500/10 text-yellow-400' },
  error: { icon: 'alert-circle', color: 'bg-red-500/10 text-red-400' },
}

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
]

const breadcrumbItems = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    apiFetch<{ items: Notification[] }>('/api/v1/notifications/?page_size=50')
      .then(data => setNotifications(data.items))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast({ title: 'All notifications marked as read' })
  }

  function handleMarkRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Notifications</h1>
              <p className="mt-1 text-sm text-muted">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <Icon name="check" size={16} />
                Mark All Read
              </Button>
            )}
          </div>
        </motion.div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications"
            description={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filtered.map((notif) => {
              const config = typeConfig[notif.type] || { icon: 'info', color: 'bg-white/5 text-muted' }
              return (
                <motion.div key={notif.id} variants={itemVariants}>
                  <Card
                    className={cn(
                      'relative flex items-start gap-4 transition-all duration-200',
                      !notif.read && 'border-l-4 border-l-gold'
                    )}
                    onClick={() => handleMarkRead(notif.id)}
                    hover
                  >
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', config.color)}>
                      <Icon name={config.icon} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{notif.title}</span>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-gold shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{notif.description}</p>
                      <p className="mt-1 text-xs text-muted/60">{formatDate(notif.createdAt, 'relative')}</p>
                    </div>
                    {notif.link && (
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Icon name="arrow-right" size={14} />
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </AuthGuard>
  )
}
