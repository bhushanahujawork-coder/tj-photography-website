'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
            <Icon name="search" size={44} className="text-muted" />
          </div>
        </div>
        <h1 className="font-serif text-8xl font-bold text-gold">404</h1>
        <h2 className="mt-4 font-serif text-2xl text-foreground">Page Not Found</h2>
        <p className="mt-3 max-w-md text-muted">
          The page you are looking for does not exist or has been moved.
          Check the URL or navigate back to the dashboard.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button>
              <Icon name="layout-dashboard" size={16} />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
