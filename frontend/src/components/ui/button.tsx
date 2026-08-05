'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:scale-100',
          variant === 'primary' && 'bg-gold text-black hover:bg-gold-light active:bg-gold-dark shadow-lg shadow-gold/20',
          variant === 'secondary' && 'bg-white/10 text-foreground hover:bg-white/20 active:bg-white/30',
          variant === 'outline' && 'border border-border bg-transparent text-foreground hover:bg-white/5 active:bg-white/10',
          variant === 'ghost' && 'bg-transparent text-foreground hover:bg-white/5 active:bg-white/10',
          variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, type ButtonProps }
