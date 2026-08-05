'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
            <Icon name="lock" size={44} className="text-red-400" />
          </div>
        </div>
        <h1 className="font-serif text-8xl font-bold text-gold">403</h1>
        <h2 className="mt-4 font-serif text-2xl text-foreground">Access Denied</h2>
        <p className="mt-3 max-w-md text-muted">
          You do not have the required permissions to access this page.
          Contact your administrator if you believe this is a mistake.
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
