'use client'

import { useEffect, useState, use } from 'react'
import { ToastProvider } from '@/hooks/use-toast'
import { ClientGalleryView } from '@/components/client/client-gallery-view'
import { CustomerGallery } from '@/components/platform/customer-gallery'
import { apiFetch } from '@/lib/api'

/**
 * Public share entry. A live share code renders the cinema gallery directly.
 * Falls back to the wedding-code lookup (existing behavior) so custom wedding
 * codes shared as /s/{code} keep working.
 */
export default function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [status, setStatus] = useState<'checking' | 'share' | 'wedding'>('checking')

  useEffect(() => {
    let cancelled = false
    apiFetch<{ wedding: { weddingName: string } }>(`/api/v1/share/${code}`)
      .then(() => {
        if (!cancelled) setStatus('share')
      })
      .catch(() => {
        if (!cancelled) setStatus('wedding')
      })
    return () => { cancelled = true }
  }, [code])

  if (status === 'share') {
    return (
      <ToastProvider>
        <ClientGalleryView shareCode={code} />
      </ToastProvider>
    )
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
      </div>
    )
  }

  return <CustomerGallery code={code} />
}