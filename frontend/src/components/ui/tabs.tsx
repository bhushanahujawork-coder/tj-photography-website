'use client'

import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative px-4 py-3 text-sm font-medium transition-colors',
            value === tab.value
              ? 'text-gold'
              : 'text-muted hover:text-foreground'
          )}
        >
          {tab.label}
          {value === tab.value && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
        </button>
      ))}
    </div>
  )
}
