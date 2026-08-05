'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variant === 'default' && 'bg-white/10 text-muted',
      variant === 'success' && 'bg-green-500/10 text-green-400',
      variant === 'warning' && 'bg-yellow-500/10 text-yellow-400',
      variant === 'error' && 'bg-red-500/10 text-red-400',
      variant === 'info' && 'bg-blue-500/10 text-blue-400',
      className
    )}>
      {children}
    </span>
  )
}
