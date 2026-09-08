'use client'

import { use } from 'react'
import { ToastProvider } from '@/hooks/use-toast'
import { ClientGalleryView } from '@/components/client/client-gallery-view'

export default function WeddingGalleryViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)

  return (
    <ToastProvider>
      <ClientGalleryView weddingCode={code} />
    </ToastProvider>
  )
}