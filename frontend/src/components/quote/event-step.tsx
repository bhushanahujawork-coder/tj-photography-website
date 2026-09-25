'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'

interface EventStepProps {
  value: string | null
  onChange: (eventType: string) => void
}

const EVENTS = [
  {
    value: 'wedding',
    label: 'Wedding',
    description: 'Full wedding coverage — multi-day rituals, candid & cinematic.',
    icon: 'heart' as const,
  },
  {
    value: 'engagement',
    label: 'Engagement',
    description: 'Engagement / ring ceremony coverage with couple shoot.',
    icon: 'star' as const,
  },
]

export function EventStep({ value, onChange }: EventStepProps) {
  const [selected, setSelected] = useState<string | null>(value)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-foreground">What are we covering?</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/70">
          Choose your event type to see matching packages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EVENTS.map((event) => {
          const active = selected === event.value
          return (
            <button
              key={event.value}
              type="button"
              onClick={() => setSelected(event.value)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all',
                active
                  ? 'border-gold bg-gold/5'
                  : 'border-border bg-white/[0.02] hover:border-gold/40',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  active ? 'bg-gold text-black' : 'bg-white/10 text-foreground/70',
                )}
              >
                <Icon name={event.icon} size={20} />
              </span>
              <span>
                <span className="block font-serif text-lg text-foreground">{event.label}</span>
                <span className="mt-1 block text-sm leading-snug text-foreground/70">
                  {event.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <Button onClick={() => selected && onChange(selected)} disabled={!selected}>
        Continue
      </Button>
    </div>
  )
}
