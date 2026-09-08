'use client'

import { FILM_ASPECTS, type FilmAspect, type HomeConfig } from '@/lib/home-config/types'
import { Field, NumberInput, SelectInput } from './controls'

type SetFn = (path: (string | number)[], value: unknown) => void

/* Mirror of the fluid helpers in films-grid so readouts state the truth. */
function fontAt(px: number, w: number): number {
  return Math.round(Math.min(px, Math.max(px * 0.81, (px / 10.24) * (w / 100))))
}

function gapAt(px: number, w: number): number {
  return Math.round(Math.min(px, Math.max(px * 0.6, (px / 14.4) * (w / 100))))
}

const ASPECT_LABELS: Record<FilmAspect, string> = {
  '4/3': '4:3',
  '16/10': '16:10',
  '16/9': '16:9',
}

function FluidReadout({ label, value, mobile, desktop }: { label: string; value: string; mobile: string; desktop: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/60 px-2.5 py-1.5">
      <span className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className="text-[12px] font-medium text-foreground whitespace-nowrap">{value}</span>
      </span>
      <span className="text-[9px] tabular-nums text-muted whitespace-nowrap">
        <span className="text-amber-600/80">{mobile}</span> · <span className="text-emerald-700/80">{desktop}</span> · fluid
      </span>
    </div>
  )
}

export function FilmStylePopover({
  config,
  set,
  onClose,
}: {
  config: HomeConfig
  set: SetFn
  onClose: () => void
}) {
  const s = config.films.style
  return (
    <div className="w-[300px] rounded-2xl border border-black/10 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-black/10 px-3.5 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
          Film style · all cards
        </span>
        <button
          onClick={onClose}
          aria-label="Close style editor"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Couple name size">
            <NumberInput value={s.nameSize} min={14} max={34} onChange={(v) => set(['films', 'style', 'nameSize'], v)} suffix="px" />
          </Field>
          <Field label="Details size">
            <NumberInput value={s.descriptionSize} min={10} max={20} onChange={(v) => set(['films', 'style', 'descriptionSize'], v)} suffix="px" />
          </Field>
        </div>
        <Field label="Photo ratio">
          <SelectInput
            value={s.aspect}
            onChange={(v) => set(['films', 'style', 'aspect'], v as FilmAspect)}
            options={FILM_ASPECTS.map((a) => ({ value: a, label: ASPECT_LABELS[a] }))}
          />
        </Field>
        <Field label="Spacing between cards">
          <NumberInput value={s.gap} min={16} max={48} onChange={(v) => set(['films', 'style', 'gap'], v)} suffix="px" />
        </Field>

        <div className="mt-1 flex flex-col gap-1.5">
          <FluidReadout
            label="Name"
            value={`${s.nameSize}px`}
            mobile={`${fontAt(s.nameSize, 390)}px @390`}
            desktop={`${fontAt(s.nameSize, 1440)}px @1440`}
          />
          <FluidReadout
            label="Details"
            value={`${s.descriptionSize}px`}
            mobile={`${fontAt(s.descriptionSize, 390)}px @390`}
            desktop={`${fontAt(s.descriptionSize, 1440)}px @1440`}
          />
          <FluidReadout
            label="Card"
            value={ASPECT_LABELS[s.aspect]}
            mobile={`${ASPECT_LABELS[s.aspect]}`}
            desktop={`${ASPECT_LABELS[s.aspect]}`}
          />
          <FluidReadout
            label="Gap"
            value={`${s.gap}px`}
            mobile={`${gapAt(s.gap, 390)}px @390`}
            desktop={`${gapAt(s.gap, 1440)}px @1440`}
          />
        </div>
      </div>

      <div className="border-t border-black/10 px-3.5 py-2.5">
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-gold px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}