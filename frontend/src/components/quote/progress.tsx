import { cn } from '@/lib/utils'

interface ProgressProps {
  steps: { key: string; label: string }[]
  current: string
  /** Click a completed step to jump back and edit it. */
  onJump?: (key: string) => void
}

export function Progress({ steps, current, onJump }: ProgressProps) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === current))
  const currentStep = steps[currentIndex]
  const percent = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="w-full">
      {/* Mobile: compact summary + hairline progress */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.15em] text-foreground/70">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {currentStep.label}
          </span>
        </div>
        <div className="h-0.5 w-full bg-foreground/15">
          <div
            className="h-0.5 bg-gold transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop: light dot + label row */}
      <ol className="hidden items-center sm:flex" aria-label="Progress">
        {steps.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const clickable = done && onJump
          return (
            <li key={step.key} className={cn('flex items-center', i > 0 && 'flex-1')}>
              {i > 0 && <span className="mx-3 h-px flex-1 bg-foreground/15" aria-hidden />}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(step.key)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap py-1 transition-colors',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                    active && 'bg-gold',
                    done && 'bg-gold',
                    !done && !active && 'bg-foreground/25',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-xs uppercase tracking-[0.08em]',
                    active && 'font-semibold text-foreground',
                    done && 'text-foreground/70 hover:text-foreground',
                    !done && !active && 'text-muted',
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
