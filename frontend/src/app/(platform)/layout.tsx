'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider } from '@/hooks/use-auth'
import { ToastProvider } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toast'
import { Sidebar } from '@/components/platform/sidebar'
import { PlatformNavbar } from '@/components/platform/navbar'
import { cn } from '@/lib/utils'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-dvh bg-background">
          <div className={cn('hidden lg:block', sidebarCollapsed ? 'w-16' : 'w-64')} />
          <div className="hidden lg:block">
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
          </div>

          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
              <div className="relative w-64">
                <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col min-w-0">
            <PlatformNavbar onMenuClick={() => setMobileSidebarOpen(true)} />
            <motion.main
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 overflow-y-auto p-6"
            >
              {children}
            </motion.main>
          </div>
        </div>
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  )
}
