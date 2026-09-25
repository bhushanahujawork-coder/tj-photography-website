'use client'

import { Icon } from '@/lib/icons'
import { formatINR } from '@/lib/quotation-calc'
import type { QuotationResult } from '@/lib/api-quotation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ResultStepProps {
  quotation: QuotationResult
  /** Start another quotation with the SAME verified phone (no OTP again). */
  onRestart: () => void
  /** Start fresh with a different phone number (clears the session). */
  onNewNumber: () => void
}

export function ResultStep({ quotation, onRestart, onNewNumber }: ResultStepProps) {
  const venueText =
    quotation.eventType === 'wedding'
      ? quotation.venues.day2
        ? `${quotation.venues.day1} · ${quotation.venues.day2}`
        : quotation.venues.day1
      : quotation.venues.venue

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-3 pt-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-black">
            <Icon name="check" size={28} />
          </span>
          <div>
            <h2 className="font-serif text-2xl text-foreground">Your Quotation</h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              Generated successfully — our team will reach out to you soon.
            </p>
          </div>
          <Badge variant="success">{quotation.status.replace(/_/g, ' ')}</Badge>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-white/[0.02] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-foreground/70">Phone</span>
            <span className="text-foreground">+91 {quotation.phone}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/70">Couple</span>
            <span className="text-foreground">{quotation.coupleName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/70">Event</span>
            <span className="text-foreground capitalize">{quotation.eventType}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/70">Date</span>
            <span className="text-foreground">{quotation.eventDate}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/70">
              Venue{quotation.eventType === 'wedding' ? 's' : ''}
            </span>
            <span className="max-w-[60%] text-right text-foreground">{venueText}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/5 p-4">
            <div>
              <p className="font-serif text-lg text-foreground">{quotation.package.name}</p>
              {quotation.package.inclusions.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {quotation.package.inclusions.map((item) => (
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
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {quotation.package.inclusionsNote}
                </p>
              )}
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
              {formatINR(quotation.basePrice)}
            </p>
          </div>

          {quotation.addOns.length > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border">
              {quotation.addOns.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span className="text-foreground">
                    {line.name}
                    <span className="ml-2 text-xs text-foreground/70">
                      {line.perDay ? `× ${line.qty} day${line.qty > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatINR(line.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-white/[0.02] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">Base package</span>
            <span className="text-foreground">{formatINR(quotation.basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">Add-ons</span>
            <span className="text-foreground">{formatINR(quotation.addOnTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-medium text-foreground">Quotation total</span>
            <span className="text-xl font-bold text-gold">
              {formatINR(quotation.quotationTotal)}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/70">{quotation.note}</p>

        <div className="flex flex-col items-center gap-2 pb-2 sm:flex-row sm:justify-center">
          <Button onClick={onRestart}>Create another quotation</Button>
          <Button variant="outline" onClick={onNewNumber}>
            Verify a different number
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
