'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { AnalyticsData } from '@/types/platform'

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function computeRatio(views: number, downloads: number): string {
  if (downloads === 0) return '—'
  return (views / downloads).toFixed(1)
}

const dateRangeOptions = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const breadcrumbItems = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const deviceColors: Record<string, string> = {
  Mobile: 'bg-gold',
  Desktop: 'bg-gold/80',
  Tablet: 'bg-gold/60',
  Other: 'bg-gold/40',
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)

  useEffect(() => {
    apiFetch<AnalyticsData>('/api/v1/dashboard/analytics')
      .then(setAnalyticsData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dailyViews = (analyticsData?.dailyViews ?? []).slice(-dateRange)
  const dailyDownloads = (analyticsData?.dailyDownloads ?? []).slice(-dateRange)
  const maxViews = Math.max(...dailyViews.map(d => d.count), 1)
  const maxDownloads = Math.max(...dailyDownloads.map(d => d.count), 1)
  const maxDeviceCount = Math.max(...(analyticsData?.viewsByDevice ?? []).map(d => d.count), 1)
  const [tooltip, setTooltip] = useState<{ label: string; value: number } | null>(null)

  const statCards = analyticsData
    ? [
        { label: 'Total Views', value: analyticsData.totalViews, icon: 'eye', desc: 'All time page views' },
        { label: 'Total Downloads', value: analyticsData.totalDownloads, icon: 'download', desc: 'All time downloads' },
        { label: 'Avg Session Duration', value: analyticsData.averageSessionDuration, icon: 'clock', desc: 'Average time on site' },
        { label: 'Bounce Rate', value: analyticsData.bounceRate, icon: 'arrow-right', desc: 'Single page sessions' },
      ]
    : []

  return (
    <AuthGuard>
      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : !analyticsData ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted">Failed to load analytics data</p>
          </div>
        ) : (
        <><motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Analytics</h1>
              <p className="mt-1 text-sm text-muted">Track performance and engagement across all weddings</p>
            </div>
            <div className="flex items-center gap-2">
              {dateRangeOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={dateRange === opt.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map(stat => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted">{stat.label}</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
                    <Icon name={stat.icon} size={18} className="text-gold" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-serif text-3xl text-foreground">{stat.value}</div>
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
          className="grid gap-6 lg:grid-cols-2"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Daily Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative flex items-end gap-1.5 h-48">
                  {dailyViews.map((day, i) => (
                    <div
                      key={day.date}
                      className="relative flex-1 group"
                      onMouseEnter={() => setTooltip({ label: day.date, value: day.count })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div
                        className="w-full rounded-t bg-gold/80 transition-all duration-200 hover:bg-gold cursor-pointer"
                        style={{ height: `${(day.count / maxViews) * 100}%` }}
                      />
                    </div>
                  ))}
                  {tooltip && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-foreground shadow-lg z-10">
                      <p className="font-medium">{tooltip.label}</p>
                      <p className="text-gold">{formatCount(tooltip.value)} views</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Daily Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative flex items-end gap-1.5 h-48">
                  {dailyDownloads.map((day, i) => (
                    <div
                      key={day.date}
                      className="relative flex-1 group"
                      onMouseEnter={() => setTooltip({ label: day.date, value: day.count })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div
                        className="w-full rounded-t bg-gold/40 transition-all duration-200 hover:bg-gold/60 cursor-pointer"
                        style={{ height: `${(day.count / maxDownloads) * 100}%` }}
                      />
                    </div>
                  ))}
                  {tooltip && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-foreground shadow-lg z-10">
                      <p className="font-medium">{tooltip.label}</p>
                      <p className="text-gold">{formatCount(tooltip.value)} downloads</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 lg:grid-cols-3"
        >
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Weddings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Wedding</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Views</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Downloads</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.topWeddings ?? []).map((wedding, i) => (
                        <motion.tr
                          key={wedding.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.35 }}
                          className="border-b border-border/50 transition-colors hover:bg-white/5"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
                                <Icon name="heart" size={16} />
                              </div>
                              <span className="text-sm font-medium text-foreground">{wedding.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm text-foreground">{formatCount(wedding.views)}</td>
                          <td className="px-4 py-3.5 text-right text-sm text-foreground">{formatCount(wedding.downloads)}</td>
                          <td className="px-4 py-3.5 text-right text-sm text-muted">{computeRatio(wedding.views, wedding.downloads)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Views by Device</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(analyticsData?.viewsByDevice ?? []).map(device => (
                  <div key={device.type}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground">{device.type}</span>
                      <span className="text-muted">{formatCount(device.count)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div
                        className={cn('h-full rounded-full transition-all', deviceColors[device.type] || 'bg-gold/40')}
                        style={{ width: `${(device.count / maxDeviceCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Views by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analyticsData?.viewsByLocation ?? []).map(loc => (
                    <div key={loc.country} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Icon name="globe" size={14} className="text-muted" />
                        <span className="text-sm text-foreground">{loc.country}</span>
                      </div>
                      <Badge variant="default">{formatCount(loc.count)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </>)}
      </div>
    </AuthGuard>
  )
}
