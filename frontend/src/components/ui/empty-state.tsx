'use client'

import { motion } from 'framer-motion'
import { Icon } from '@/lib/icons'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'image', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/5 ring-1 ring-gold/20 shadow-lg shadow-gold/5">
        <Icon name={icon} size={28} className="text-gold" />
      </div>
      <h3 className="font-serif text-xl text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted/80 leading-relaxed">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </motion.div>
  )
}
