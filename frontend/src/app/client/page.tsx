'use client'

import { ToastProvider } from '@/hooks/use-toast'
import ClientDashboard from '@/components/client/client-dashboard'

export default function ClientPage() {
  return (
    <ToastProvider>
      <ClientDashboard />
    </ToastProvider>
  )
}
