'use client'

import { Icon } from '@/lib/icons'
import { formatINR } from '@/lib/quotation-calc'
import type { DetailsValue } from '@/components/quote/details-step'
import type { QuotationAddOnLine, QuotationPackage } from '@/lib/api-quotation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LineGroup {
  group: string
  lines: QuotationAddOnLine[]
  subtotal: number
}

interface QuotationStepProps {
  eventType: string
  details: DetailsValue
  pkg: QuotationPackage | null
  lines: QuotationAddOnLine[]
  groupedLines: LineGroup[]
  totals: { basePrice: number; addOnTotal: number; total: number }
  note: string
  generating: boolean
  error: string | null
  onBack: () => void
  onGenerate: () => void
  onEditDetails: () => void
  onEditPackage: () => void
  onEditAddOns: () => void
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70">
        {children}
      </h3>
      <span className="h-px flex-1 bg-border" aria-hidden />
      {action}
    </div>
  )
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
    >
      <Icon name="edit" size={12} />
      {label}
    </button>
  )
}

export function QuotationStep({
  eventType,
  details,
  pkg,
  lines,
  groupedLines,
  totals,
  note,
  generating,
  error,
  onBack,
  onGenerate,
  onEditDetails,
  onEditPackage,
  onEditAddOns,
}: QuotationStepProps) {
  if (!pkg) return null

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <h2 className="font-serif text-xl text-foreground">Your quotation</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">
            Sab check kar lo — Generate se pehle kuch bhi edit kar sakte ho.
          </p>
        </div>

        {/* Event details */}
        <section>
          <SectionLabel action={<EditButton label="Edit" onClick={onEditDetails} />}>
            Event details
          </SectionLabel>
          <dl className="space-y-2 rounded-lg border border-border bg-white/[0.02] px-4 py-3.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/70">Event</dt>
              <dd className="text-right capitalize text-foreground">{eventType}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/70">Couple</dt>
              <dd className="text-right text-foreground">{details.coupleName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/70">Date</dt>
              <dd className="text-right text-foreground">{details.eventDate}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-foreground/70">Venue{eventType === 'wedding' ? 's' : ''}</dt>
              <dd className="text-right text-foreground">
                {eventType === 'wedding'
                  ? details.day2
                    ? `${details.day1} · ${details.day2}`
                    : details.day1
                  : details.venue}
              </dd>
            </div>
          </dl>
        </section>

        {/* Package */}
        <section>
          <SectionLabel action={<EditButton label="Change" onClick={onEditPackage} />}>
            Package
          </SectionLabel>
          <div className="rounded-lg border border-gold/40 bg-gold/5 px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-lg text-foreground">{pkg.name}</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatINR(pkg.price)}
              </span>
            </div>
            {pkg.inclusions.length > 0 ? (
              <ul className="mt-2.5 space-y-1 border-t border-gold/20 pt-2.5">
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
            ) : (
              <p className="mt-2 border-t border-gold/20 pt-2.5 text-sm leading-relaxed text-foreground/70">
                {pkg.inclusionsNote}
              </p>
            )}
          </div>
        </section>

        {/* Add-ons */}
        <section>
          <SectionLabel action={<EditButton label="Edit add-ons" onClick={onEditAddOns} />}>
            Add-ons {lines.length === 0 && <span className="text-foreground/60">(none)</span>}
          </SectionLabel>
          {groupedLines.length > 0 ? (
            <div className="space-y-3">
              {groupedLines.map(({ group, lines: groupLines, subtotal }) => (
                <div key={group} className="rounded-lg border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-white/[0.02] px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/70">
                      {group}
                    </span>
                    <span className="text-sm font-medium text-foreground/70 tabular-nums">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {groupLines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                      >
                        <span className="min-w-0 text-foreground">
                          {line.name}
                          {line.perDay && (
                            <span className="ml-1.5 text-xs text-foreground/70 tabular-nums">
                              × {line.qty} day{line.qty > 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-foreground tabular-nums">
                          {formatINR(line.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-white/[0.02] px-4 py-3 text-sm text-foreground/70">
              Koi add-on nahi chuna.
            </p>
          )}
        </section>

        {/* Totals */}
        <section className="rounded-lg border border-border px-4 py-3.5">
          <div className="flex justify-between py-0.5 text-sm">
            <span className="text-foreground/70">Base package ({pkg.name})</span>
            <span className="text-foreground tabular-nums">{formatINR(totals.basePrice)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-sm">
            <span className="text-foreground/70">Add-ons ({lines.length})</span>
            <span className="text-foreground tabular-nums">{formatINR(totals.addOnTotal)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="font-medium text-foreground">Estimated total</span>
            <span className="text-2xl font-bold text-gold tabular-nums">
              {formatINR(totals.total)}
            </span>
          </div>
        </section>

        <p className="text-sm leading-relaxed text-foreground/70">{note}</p>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
            <Icon name="alert-circle" size={14} />
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={onBack} disabled={generating}>
            Back
          </Button>
          <Button
            onClick={onGenerate}
            loading={generating}
            disabled={generating}
            className="sm:min-w-56"
          >
            Generate Quotation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
