'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface DetailsValue {
  coupleName: string
  eventDate: string
  day1: string
  day2: string
  venue: string
}

interface DetailsStepProps {
  eventType: string
  value: DetailsValue
  onChange: (value: DetailsValue) => void
  onBack: () => void
  onNext: () => void
}

interface FieldErrors {
  coupleName?: string
  eventDate?: string
  day1?: string
  venue?: string
}

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function DetailsStep({ eventType, value, onChange, onBack, onNext }: DetailsStepProps) {
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = (patch: Partial<DetailsValue>) => onChange({ ...value, ...patch })

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!value.coupleName.trim()) next.coupleName = 'Couple name is required'

    if (!value.eventDate) {
      next.eventDate = 'Event date is required'
    } else if (value.eventDate < todayISO()) {
      next.eventDate = 'Past date nahi chalegi — aaj ya usse aage chuno'
    }

    if (eventType === 'wedding') {
      // Day 2 is OPTIONAL — one-day weddings are allowed.
      if (!value.day1.trim()) next.day1 = 'Day 1 venue is required'
    } else if (!value.venue.trim()) {
      next.venue = 'Venue is required'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-foreground">Event details</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/70">
          {eventType === 'wedding'
            ? 'Apne wedding days aur venues daalo.'
            : 'Apne engagement function ki details daalo.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Couple name"
          placeholder="e.g. Aarav & Diya"
          value={value.coupleName}
          onChange={(e) => set({ coupleName: e.target.value })}
          error={errors.coupleName}
        />
        <Input
          label="Event date"
          type="date"
          min={todayISO()}
          value={value.eventDate}
          onChange={(e) => set({ eventDate: e.target.value })}
          error={errors.eventDate}
        />
      </div>

      {eventType === 'wedding' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Day 1 venue"
              placeholder="e.g. Rajmahal Banquet, Jamnagar"
              value={value.day1}
              onChange={(e) => set({ day1: e.target.value })}
              error={errors.day1}
            />
            <Input
              label="Day 2 venue (optional)"
              placeholder="Agar 2-day function hai toh daalo"
              value={value.day2}
              onChange={(e) => set({ day2: e.target.value })}
            />
          </div>
          <p className="text-sm leading-relaxed text-foreground/70">
            Single-day wedding hai? Day 2 khaali chhod do — bas Day 1 venue zaroori hai.
          </p>
        </div>
      ) : (
        <Input
          label="Venue"
          placeholder="e.g. Hotel Kingsway, Jamnagar"
          value={value.venue}
          onChange={(e) => set({ venue: e.target.value })}
          error={errors.venue}
        />
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
