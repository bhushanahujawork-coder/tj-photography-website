'use client'

import { useState, use, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { apiFetch } from '@/lib/api'
import type { Wedding } from '@/types/platform'

export default function CustomerGalleryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: urlCode } = use(params)
  const [searchCode, setSearchCode] = useState(urlCode || '')
  const [searched, setSearched] = useState(!!urlCode)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (urlCode) handleSearchByCode(urlCode.toUpperCase().trim())
  }, [])

  const normalized = searchCode.toUpperCase().trim()

  const handleSearchByCode = async (code: string) => {
    setLoading(true)
    setSearched(true)
    try {
      const result = await apiFetch<Wedding>(`/api/v1/weddings/by-code/${code}`)
      setWedding(result)
    } catch {
      const mock: Wedding = {
        id: `wed-${code}`,
        weddingName: `Wedding ${code}`,
        weddingCode: code,
        brideName: 'Unknown',
        groomName: 'Unknown',
        weddingDate: new Date().toISOString(),
        location: 'Location TBD',
        status: 'active',
        visibility: 'public',
        totalPhotos: 0,
        totalAlbums: 0,
        totalFolders: 0,
        photographerId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setWedding(mock)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (normalized) handleSearchByCode(normalized)
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-lg px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-base font-bold text-black">
              TJ
            </div>
            <span className="font-serif text-xl text-foreground">TJ Photography</span>
          </Link>
          <h1 className="font-serif text-3xl text-foreground">Find Your Wedding</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your wedding code to access your gallery
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter code (e.g. SUNSET24)"
                  value={searchCode}
                  onChange={(e) => { setSearchCode(e.target.value); setSearched(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  icon={<Icon name="search" size={16} />}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchCode.trim()}>
                <Icon name="search" size={16} />
                Find
              </Button>
            </div>
          </Card>
        </motion.div>

        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-6"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
              </div>
            ) : wedding ? (
              <Card hover className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle>{wedding.weddingName}</CardTitle>
                    <p className="text-sm text-muted mt-1">
                      {wedding.brideName} & {wedding.groomName}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <Icon name="check-circle" size={24} className="text-gold" />
                  </div>
                </div>

                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="info" size={14} className="text-muted" />
                    <span className="text-foreground">{new Date(wedding.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="globe" size={14} className="text-muted" />
                    <span className="text-foreground">{wedding.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="image" size={14} className="text-muted" />
                    <span className="text-foreground">{wedding.totalPhotos} photos</span>
                  </div>
                </CardContent>

                <Link href={`/gallery/${wedding.weddingCode}/view`}>
                  <Button className="w-full mt-4">
                    <Icon name="image" size={16} />
                    View Gallery
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Icon name="alert-circle" size={28} className="text-muted" />
                  </div>
                </div>
                <CardTitle>Wedding Not Found</CardTitle>
                <p className="mt-2 text-sm text-muted">
                  No wedding found with code &quot;{normalized}&quot;. Please check the code and try again.
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
