'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import type { NavItem } from '@/types/platform'
import { site } from '@/data/site'

const sidebarNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Weddings', href: '/weddings', icon: 'heart' },
  { label: 'Gallery', href: '/gallery', icon: 'images' },
  { label: 'Albums', href: '/albums', icon: 'images' },
  { label: 'Participants', href: '/participants', icon: 'users' },
  { label: 'Downloads', href: '/downloads', icon: 'download' },
  { label: 'Branding', href: '/settings?tab=branding', icon: 'palette' },
  { label: 'Analytics', href: '/analytics', icon: 'layout-dashboard' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-border bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-0' : 'px-4')}>
        <Link href="/dashboard" className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-black shadow-lg shadow-gold/20">
            TJ
          </div>
          {!collapsed && (
            <span className="font-serif text-lg tracking-wide text-foreground">{site.brand.name}</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {sidebarNav.map((item: NavItem) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
               className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-gold/10 text-gold shadow-[inset_3px_0_0_0_#D4AF37]'
                  : 'text-muted hover:bg-white/5 hover:text-foreground hover:pl-4'
              )}
            >
              <Icon name={item.icon} size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-all duration-200 hover:bg-white/5 hover:text-foreground hover:scale-[1.02] active:scale-[0.98]',
            collapsed && 'justify-center'
          )}
        >
          <Icon name="chevron-left" size={18} className={cn('transition-transform duration-200', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
