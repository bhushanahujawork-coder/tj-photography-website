'use client'

import type { HomeConfig } from '@/lib/home-config/types'
import { RangeInput } from './controls'

type SetFn = (path: (string | number)[], value: unknown) => void

const NOISE_GRADES: { at: number; label: string }[] = [
  { at: 0, label: 'Clean' },
  { at: 1, label: 'Subtle' },
  { at: 5, label: 'Recommended · Subtle / Premium' },
  { at: 6, label: 'Noticeable' },
  { at: 11, label: 'Editorial' },
  { at: 19, label: 'Strong · Textured' },
  { at: 26, label: 'Maximum' },
]

export function noiseGradeLabel(n: number): string {
  const v = Math.max(0, Math.min(30, Math.round(n)))
  let grade = NOISE_GRADES[0].label
  for (const g of NOISE_GRADES) {
    if (v >= g.at) grade = g.label
  }
  return grade
}

export function BackgroundNoisePopover({
  config,
  set,
  onClose,
}: {
  config: HomeConfig
  set: SetFn
  onClose: () => void
}) {
  const noise = config.global.noise
  return (
    <div className="w-[300px] rounded-2xl border border-black/10 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-black/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] leading-none text-black">
            ◫
          </span>
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
            Background appearance
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close background editor"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 px-3.5 py-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Background noise</span>
            <button
              onClick={() => set(['global', 'noise'], 5)}
              className="text-[9px] uppercase tracking-wider text-gold-dark hover:text-foreground transition-colors"
            >
              Reset to 5%
            </button>
          </div>
          <p className="mt-0.5 text-[10px] text-muted">Fine photographic film grain. 0% = clean background.</p>
          <div className="mt-1.5">
            <RangeInput value={noise} min={0} max={30} onChange={(v) => set(['global', 'noise'], v)} suffix="%" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/60 px-2.5 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Current</span>
          <span className="text-[12px] font-semibold tabular-nums text-foreground">
            Noise · {noise}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/60 px-2.5 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Look</span>
          <span className="text-[11px] font-medium text-gold-dark">{noiseGradeLabel(noise)}</span>
        </div>

        <p className="text-[10px] leading-relaxed text-muted">
          Applied as a static premium grain across the whole site backdrop. 5% is the recommended setting.
        </p>
      </div>
    </div>
  )
}