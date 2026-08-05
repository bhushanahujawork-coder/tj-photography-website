'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Icon } from '@/lib/icons'
import { getInitials, formatDate } from '@/lib/utils'
import { Dropdown } from '@/components/ui/dropdown'
import { apiFetch } from '@/lib/api'
import type { Notification } from '@/types/platform'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PlatformNavbarProps {
  onMenuClick: () => void
}

export function PlatformNavbar({ onMenuClick }: PlatformNavbarProps) {
  const { user, logout, hasRole } = useAuth()
  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    apiFetch<Notification[]>('/api/v1/notifications/?page_size=10')
      .then(data => setNotifications(data))
      .catch(() => {})
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors lg:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {hasRole(['admin', 'photographer']) && (
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors border border-border"
          >
            View Site
          </Link>
        )}

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <Icon name="bell" size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-gold hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted">No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { setNotifOpen(false); if (n.link) router.push(n.link) }}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                          !n.read ? 'border-l-2 border-gold bg-gold/[0.02]' : ''
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${
                          n.type === 'success' ? 'text-green-400' :
                          n.type === 'warning' ? 'text-yellow-400' :
                          n.type === 'error' ? 'text-red-400' : 'text-gold'
                        }`}>
                          <Icon name={
                            n.type === 'success' ? 'check-circle' :
                            n.type === 'warning' ? 'warning' :
                            n.type === 'error' ? 'alert-circle' : 'info'
                          } size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">{n.title}</p>
                          <p className="truncate text-xs text-muted">{n.description}</p>
                          <p className="mt-0.5 text-[10px] text-muted/50">{formatDate(n.createdAt, 'relative')}</p>
                        </div>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                      </button>
                    ))
                  )}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-border px-4 py-3 text-center text-xs text-gold hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </>
          )}
        </div>

        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/5 transition-colors">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold">
                  {user ? getInitials(user.name) : '?'}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-foreground leading-tight">{user?.name}</p>
                <p className="text-xs text-muted capitalize">{user?.role}</p>
              </div>
              <Icon name="chevron-down" size={14} className="hidden text-muted sm:block" />
            </button>
          }
          items={[
            { label: 'Profile', value: 'profile', onClick: () => router.push('/profile') },
            { label: 'Settings', value: 'settings', onClick: () => router.push('/settings') },
            { label: 'Sign Out', value: 'logout', danger: true, onClick: logout },
          ]}
        />
      </div>
    </header>
  )
}
