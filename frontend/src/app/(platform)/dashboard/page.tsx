'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { DashboardStats } from '@/types/platform'



const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  active: 'success',
  draft: 'warning',
  archived: 'default',
}

const breadcrumbItems = [{ label: 'Dashboard' }]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

const quickActions = [
  { label: 'New Wedding', href: '/weddings/new', icon: 'plus', description: 'Create a new wedding gallery' },
  { label: 'Upload Photos', href: '/weddings', icon: 'upload', description: 'Add photos to a wedding' },
  { label: 'Invite Clients', href: '/participants', icon: 'user-plus', description: 'Send invitations' },
  { label: 'Branding', href: '/settings?tab=branding', icon: 'palette', description: 'Customize gallery theme' },
] as const

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const duration = 1500
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await apiFetch<DashboardStats>('/api/v1/dashboard/stats')
        setStats(data)
      } catch (e) {
        console.error('Failed to load dashboard stats', e)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const weddings = stats?.recentWeddings ?? []

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted text-sm">Loading dashboard...</p>
        </div>
      </AuthGuard>
    )
  }

  const statCards = [
    { label: 'Total Weddings', key: 'totalWeddings' as const, icon: 'heart', value: stats?.totalWeddings ?? 0, desc: 'Active galleries' },
    { label: 'Total Photos', key: 'totalPhotos' as const, icon: 'images', value: stats?.totalPhotos ?? 0, desc: 'Across all weddings' },
    { label: 'Total Storage', key: 'totalStorage' as const, icon: 'archive', value: stats?.totalStorage ?? 0, desc: `${formatBytes(stats?.storageUsed ?? 0)} used` },
    { label: 'Total Downloads', key: 'totalDownloads' as const, icon: 'download', value: stats?.totalDownloads ?? 0, desc: 'All time' },
  ]

  return (
    <AuthGuard>
      <div className="relative">
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-gold/[0.03] to-transparent blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-gradient-to-tr from-gold/[0.02] to-transparent blur-3xl" aria-hidden="true" />
        <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
              <p className="mt-1 text-sm text-muted">Overview of your wedding photography business</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Icon name="download" size={16} />
                Export
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/weddings/new')}>
                <Icon name="plus" size={16} />
                New Wedding
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat) => (
            <motion.div key={stat.key} variants={itemVariants}>
              <Card className="group h-full transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted transition-colors duration-300 group-hover:text-gold/80">{stat.label}</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20 transition-all duration-300 group-hover:from-gold/30 group-hover:to-gold/10">
                    <Icon name={stat.icon} size={18} className="text-gold" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-serif text-3xl text-foreground transition-all duration-300 group-hover:text-gold">
                    {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted">{stat.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 lg:grid-cols-3"
        >
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Weddings</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/weddings')}>
                  View All
                  <Icon name="arrow-right" size={14} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Wedding</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Couple</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Photos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weddings.map((wedding, i) => (
                        <motion.tr
                          key={wedding.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.35 }}
                          onClick={() => router.push(`/weddings/${wedding.id}`)}
                          className="border-b border-border/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-gold/[0.03] hover:to-transparent hover:border-gold/20 cursor-pointer group"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold transition-all duration-200 group-hover:bg-gold/20 group-hover:shadow-sm group-hover:shadow-gold/10">
                                <Icon name="heart" size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-gold">{wedding.weddingName}</p>
                                <p className="text-xs text-muted">{wedding.weddingCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {wedding.brideName} & {wedding.groomName}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted">
                            {formatDate(wedding.weddingDate, 'short')}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={statusVariant[wedding.status] || 'default'}>
                              {wedding.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium text-foreground">
                            {wedding.totalPhotos.toLocaleString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition-all duration-200 hover:border-gold/30 hover:bg-gradient-to-r hover:from-gold/[0.03] hover:to-transparent hover:shadow-sm hover:shadow-gold/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20 transition-all duration-200 group-hover:from-gold/30 group-hover:to-gold/10 group-hover:shadow-sm group-hover:shadow-gold/10">
                      <Icon name={action.icon} size={18} className="text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-gold">{action.label}</p>
                      <p className="truncate text-xs text-muted">{action.description}</p>
                    </div>
                    <Icon name="chevron-right" size={14} className="shrink-0 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      </div>
    </AuthGuard>
  )
}
