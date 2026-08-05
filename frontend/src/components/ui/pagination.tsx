'use client'

import { cn } from '@/lib/utils'

interface PaginationProps {
  current: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {pages.map((page, i) => (
        page === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-muted">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={cn(
              'min-w-[36px] rounded-lg px-3 py-2 text-sm transition-colors',
              page === current
                ? 'bg-gold text-black font-medium'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
          >
            {page}
          </button>
        )
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  )
}
