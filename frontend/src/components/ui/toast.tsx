'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/lib/icons'
import { useToast, type Toast as ToastType } from '@/hooks/use-toast'

const iconMap: Record<string, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'warning',
  default: 'info',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast: ToastType) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className={`
              relative flex items-start gap-3 rounded-xl border bg-card/80 p-4 shadow-lg backdrop-blur-xl
              ${toast.variant === 'success' ? 'border-green-500/30 shadow-green-500/5' : ''}
              ${toast.variant === 'error' ? 'border-red-500/30 shadow-red-500/5' : ''}
              ${toast.variant === 'warning' ? 'border-yellow-500/30 shadow-yellow-500/5' : ''}
              ${!toast.variant || toast.variant === 'default' ? 'border-border shadow-gold/5' : ''}
            `}
          >
            <div className={`
              mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg
              ${toast.variant === 'success' ? 'bg-green-500/10 text-green-400' : ''}
              ${toast.variant === 'error' ? 'bg-red-500/10 text-red-400' : ''}
              ${toast.variant === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : ''}
              ${!toast.variant || toast.variant === 'default' ? 'bg-gold/10 text-gold' : ''}
            `}>
              <Icon name={iconMap[toast.variant || 'default']} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-muted">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-lg p-1 text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Icon name="x" size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
