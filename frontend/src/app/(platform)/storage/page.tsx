'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { StorageInfo } from '@/types/platform'

export default function StoragePage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<StorageInfo>('/api/v1/storage/usage')
        setStorageInfo(data)
      } catch (e) {
        console.error('Failed to load storage info', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const storagePercent = storageInfo ? Math.round((storageInfo.usedBytes / storageInfo.limitBytes) * 100) : 0

  const storageColor = storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
  const storageTextColor = storagePercent > 90 ? 'text-red-400' : storagePercent > 70 ? 'text-yellow-400' : 'text-green-400'

  const breakdownCards = [
    { label: 'Photos', value: storageInfo?.photoCount.toLocaleString() ?? '...', icon: 'image', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Videos', value: storageInfo?.videoCount.toLocaleString() ?? '...', icon: 'video', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Albums', value: storageInfo?.albumCount.toLocaleString() ?? '...', icon: 'folder', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ]

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Storage' }]} />

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-serif text-3xl text-foreground">Storage</h1>
          <p className="mt-1 text-sm text-muted">Monitor your storage usage and capacity</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Storage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-serif text-4xl text-foreground">
                      {storageInfo ? Math.round(storageInfo.usedBytes / 1073741824 * 10) / 10 : '...'}
                      <span className="text-lg text-muted font-sans"> GB</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      of {storageInfo ? Math.round(storageInfo.limitBytes / 1073741824) : '...'} GB used
                    </p>
                  </div>
                  <Badge variant={storagePercent > 90 ? 'error' : storagePercent > 70 ? 'warning' : 'success'}>
                    {storagePercent}% Used
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${storagePercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={cn('h-full rounded-full', storageColor)}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted/50">
                    <span>0 GB</span>
                    <span>{storageInfo ? Math.round(storageInfo.limitBytes / 1073741824) : '...'} GB</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            {breakdownCards.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted">{item.label}</CardTitle>
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.bg)}>
                      <Icon name={item.icon} size={18} className={item.color} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-serif text-3xl text-foreground">{item.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
