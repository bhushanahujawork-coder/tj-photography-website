'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { formatINR } from '@/lib/quotation-calc'
import type { QuotationPackage } from '@/lib/api-quotation'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

interface PackageStepProps {
  packages: QuotationPackage[]
  value: string
  onChange: (packageId: string) => void
  onBack: () => void
  onNext: () => void
}

function InclusionList({ pkg }: { pkg: QuotationPackage }) {
  if (pkg.inclusions.length === 0) {
    return <p className="text-sm leading-relaxed text-foreground/70">{pkg.inclusionsNote}</p>
  }
  return (
    <ul className="space-y-1.5">
      {pkg.inclusions.map((item) => (
        <li
          key={item}
          className="flex items-start gap-1.5 text-sm leading-relaxed text-foreground"
        >
          <Icon name="check" size={13} className="mt-0.5 shrink-0 text-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function PackageStep({ packages, value, onChange, onBack, onNext }: PackageStepProps) {
  const [compareOpen, setCompareOpen] = useState(false)
  const selected = packages.find((p) => p.id === value)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-foreground">Choose your package</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/70">
          Silver, Golden aur Diamond compare karo — jo fit kare wo chuno.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {packages.map((pkg) => {
          const active = value === pkg.id
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange(pkg.id)}
              aria-pressed={active}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors sm:p-5',
                active
                  ? 'border-gold bg-gold/5'
                  : 'border-border bg-white/[0.02] hover:border-gold/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-lg text-foreground">{pkg.name}</span>
                {active && (
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                    <Icon name="check" size={13} className="text-gold" />
                    Selected
                  </span>
                )}
              </div>

              <span className="text-2xl font-bold tabular-nums text-gold">
                {formatINR(pkg.price)}
              </span>

              <div className="border-t border-border pt-3">
                <InclusionList pkg={pkg} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCompareOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          <Icon name="columns" size={14} className="text-gold" />
          Compare packages
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!value}>
            Continue
          </Button>
        </div>
      </div>

      {selected && (
        <p className="rounded-lg border border-border bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-foreground/70">
          <span className="font-medium text-foreground">{selected.name} selected.</span>{' '}
          Included services fix hain — extra services (Drone, Reels, Editing waghera) next step me
          add kar sakte ho.
        </p>
      )}

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compare packages"
        description="Sab packages me kya included hai — ek nazar me."
        size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                'rounded-xl border p-4',
                value === pkg.id ? 'border-gold bg-gold/5' : 'border-border',
              )}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="font-serif text-base text-foreground">{pkg.name}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatINR(pkg.price)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <InclusionList pkg={pkg} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground/70">
          Add-ons (Rituals, Photography, Editing) alag se choose kiye jaate hain — sabke apne
          fixed/per-day rates hain.
        </p>
      </Modal>
    </div>
  )
}
