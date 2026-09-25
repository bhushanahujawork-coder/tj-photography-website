'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { formatINR } from '@/lib/quotation-calc'
import type { QuotationAddOn } from '@/lib/api-quotation'
import { Button } from '@/components/ui/button'

interface CustomizeStepProps {
  addOns: QuotationAddOn[]
  selections: Record<string, number>
  onChange: (selections: Record<string, number>) => void
  minQty: number
  maxQty: number
  defaultQty: number
  onBack: () => void
  onNext: () => void
}

export function CustomizeStep({
  addOns,
  selections,
  onChange,
  minQty,
  maxQty,
  defaultQty,
  onBack,
  onNext,
}: CustomizeStepProps) {
  const groups = useMemo(() => {
    const map = new Map<string, QuotationAddOn[]>()
    for (const addOn of addOns) {
      const list = map.get(addOn.group) ?? []
      list.push(addOn)
      map.set(addOn.group, list)
    }
    return Array.from(map.entries())
  }, [addOns])

  const toggle = (addOn: QuotationAddOn) => {
    const next = { ...selections }
    if (next[addOn.id]) {
      delete next[addOn.id]
    } else {
      next[addOn.id] = addOn.perDay ? defaultQty : 1
    }
    onChange(next)
  }

  const setQty = (addOn: QuotationAddOn, qty: number) => {
    const clamped = Math.min(maxQty, Math.max(minQty, qty))
    onChange({ ...selections, [addOn.id]: clamped })
  }

  const selectedCount = Object.keys(selections).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-foreground">Customize with add-ons</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/70">
          Package ki services fix hain — yahan sirf extras add hote hain.{' '}
          {selectedCount > 0 && (
            <span className="font-semibold text-foreground">
              {selectedCount} selected.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-6">
        {groups.map(([group, items]) => (
          <section key={group}>
            <div className="mb-2.5 flex items-center gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70">
                {group}
              </h3>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            <div className="space-y-2">
              {items.map((addOn) => {
                const selected = Boolean(selections[addOn.id])
                const qty = selections[addOn.id] ?? 1
                const amount = addOn.perDay ? addOn.price * qty : addOn.price
                return (
                  <div
                    key={addOn.id}
                    className={cn(
                      'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5 transition-colors',
                      selected ? 'border-gold/50 bg-gold/5' : 'border-border bg-white/[0.02]',
                    )}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggle(addOn)}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        selected ? 'border-gold bg-gold text-black' : 'border-muted text-transparent',
                      )}
                      aria-label={`${selected ? 'Remove' : 'Add'} ${addOn.name}`}
                    >
                      <Icon name="check" size={12} />
                    </button>

                    <span className="min-w-0 flex-1 basis-40">
                      <span className="block text-sm leading-snug text-foreground">
                        {addOn.name}
                      </span>
                      <span className="text-sm text-foreground/70 tabular-nums">
                        {formatINR(addOn.price)}
                        {addOn.perDay ? ' / day' : ' fixed'}
                      </span>
                    </span>

                    {selected && addOn.perDay && (
                      <span className="flex items-center gap-1.5" aria-label="Day quantity">
                        <button
                          type="button"
                          onClick={() => setQty(addOn, qty - 1)}
                          disabled={qty <= minQty}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                          aria-label={`Decrease days for ${addOn.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm text-foreground tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(addOn, qty + 1)}
                          disabled={qty >= maxQty}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                          aria-label={`Increase days for ${addOn.name}`}
                        >
                          +
                        </button>
                      </span>
                    )}

                    {selected && (
                      <span className="ml-auto w-24 text-right text-sm font-semibold text-foreground tabular-nums">
                        {formatINR(amount)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          {selectedCount > 0 ? 'Continue' : 'Skip — continue'}
        </Button>
      </div>
    </div>
  )
}
