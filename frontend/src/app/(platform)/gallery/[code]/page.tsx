'use client'

import { use } from 'react'
import { CustomerGallery } from '@/components/platform/customer-gallery'

export default function CustomerGalleryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  return <CustomerGallery code={code} />
}