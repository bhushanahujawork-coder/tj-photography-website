'use client'

import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
  onClick?: () => void
  glass?: boolean
  interactive?: boolean
}

export function Card({ className, children, hover, onClick, glass, interactive }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 transition-all duration-300',
        hover && 'hover:border-gold/30 hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/5 cursor-pointer',
        glass && 'bg-card/60 backdrop-blur-xl border-white/10',
        interactive && 'hover:scale-[1.01] hover:border-gold/20 cursor-pointer active:scale-[0.99]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('font-serif text-lg text-foreground', className)}>{children}</h3>
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-sm text-muted mt-1', className)}>{children}</p>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-4 flex items-center gap-2', className)}>{children}</div>
}
