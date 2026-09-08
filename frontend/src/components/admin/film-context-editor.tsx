'use client'

import { useMemo, useState } from 'react'
import type { HomeConfig } from '@/lib/home-config/types'
import { youtubeIdFromInput } from '@/lib/home-config/shared'

export const FILM_COUPLE_MAX = 40
export const FILM_DETAILS_MAX = 120

function charColor(len: number, max: number): { cls: string; label: string } {
  if (len >= max) return { cls: 'text-red-600', label: 'at limit' }
  if (len >= max * 0.8) return { cls: 'text-amber-600', label: 'getting long' }
  return { cls: 'text-emerald-600', label: 'ok' }
}

function urlStillLoading(v: string): boolean {
  return /[:/.]/.test(v) || /^(https?:\/)?\/?(www\.)?(youtu\.be\/|youtube\.)/i.test(v)
}

type SetFn = (path: (string | number)[], value: unknown) => void

export function FilmContextCard({
  config,
  filmId,
  set,
  onClose,
  onRemove,
  onMove,
}: {
  config: HomeConfig
  filmId: string
  set: SetFn
  onClose: () => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
}) {
  const cards = config.films.cards
  const index = cards.findIndex((c) => c.id === filmId)
  const card = index >= 0 ? cards[index] : null
  const savedEmbedId = card?.embedId ?? ''

  /* YouTube draft string — lets the user type/paste a full URL and commits the
     extracted ID to config only when a valid 11-char ID is detected. The panel
     is remounted per card (keyed by id), so the draft starts from this card's
     saved embedId. */
  const [draft, setDraft] = useState(savedEmbedId)

  const handleYoutubeChange = (v: string) => {
    setDraft(v)
    const id = youtubeIdFromInput(v)
    set(['films', 'cards', index, 'embedId'], id ?? (v.trim() ? savedEmbedId : ''))
    if (id) setDraft(id)
  }

  const parsed = useMemo(() => youtubeIdFromInput(draft), [draft])

  const youtubeStatus = (() => {
    const t = draft.trim()
    if (parsed) return { kind: 'ok' as const, msg: `✓ ${parsed}` }
    if (!t) return { kind: 'idle' as const, msg: 'Paste a YouTube link or 11-char video ID' }
    if (urlStillLoading(t)) return { kind: 'pending' as const, msg: 'Detecting…' }
    return { kind: 'error' as const, msg: 'Enter a YouTube link or a valid 11-char video ID' }
  })()

  if (!card) return null

  const setCouple = (v: string) => set(['films', 'cards', index, 'couple'], v)
  const setDetails = (v: string) => set(['films', 'cards', index, 'description'], v)

  return (
    <div className="w-[300px] rounded-2xl border border-black/10 bg-white shadow-2xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-black/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] leading-none text-black">
            ✎
          </span>
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
            Edit film card
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close card editor"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 px-3.5 py-3">
        {/* Couple name */}
        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted">
            Couple name
            <span className={`tabular-nums ${charColor(card.couple.length, FILM_COUPLE_MAX).cls}`}>
              {card.couple.length} / {FILM_COUPLE_MAX}
            </span>
          </label>
          <input
            value={card.couple}
            maxLength={FILM_COUPLE_MAX}
            onChange={(e) => setCouple(e.target.value)}
            placeholder="e.g. Prince & Jensi"
            className={`w-full rounded-lg border px-2.5 py-1.5 text-[13px] text-foreground outline-none transition-colors ${
              card.couple.length >= FILM_COUPLE_MAX
                ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                : card.couple.length >= FILM_COUPLE_MAX * 0.8
                ? 'border-amber-400 focus:ring-1 focus:ring-amber-400'
                : 'border-black/10 focus:border-gold focus:ring-1 focus:ring-gold'
            }`}
          />
        </div>

        {/* Details */}
        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted">
            Details
            <span className={`tabular-nums ${charColor(card.description.length, FILM_DETAILS_MAX).cls}`}>
              {card.description.length} / {FILM_DETAILS_MAX}
            </span>
          </label>
          <textarea
            value={card.description}
            maxLength={FILM_DETAILS_MAX}
            rows={2}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Short, two-line description — keeps the card balanced."
            className={`w-full resize-none rounded-lg border px-2.5 py-1.5 text-[12px] leading-relaxed text-foreground outline-none transition-colors ${
              card.description.length >= FILM_DETAILS_MAX
                ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                : card.description.length >= FILM_DETAILS_MAX * 0.8
                ? 'border-amber-400 focus:ring-1 focus:ring-amber-400'
                : 'border-black/10 focus:border-gold focus:ring-1 focus:ring-gold'
            }`}
          />
        </div>

        {/* YouTube */}
        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted">
            YouTube video
          </label>
          <input
            value={draft}
            onChange={(e) => handleYoutubeChange(e.target.value)}
            placeholder="Link or 11-char video ID"
            className={`w-full rounded-lg border px-2.5 py-1.5 text-[12px] text-foreground outline-none transition-colors ${
              youtubeStatus.kind === 'error'
                ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                : youtubeStatus.kind === 'ok'
                ? 'border-emerald-300 focus:ring-1 focus:ring-emerald-300'
                : 'border-black/10 focus:border-gold focus:ring-1 focus:ring-gold'
            }`}
          />
          <div className="mt-1.5 flex items-center gap-2">
            {parsed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://img.youtube.com/vi/${parsed}/hqdefault.jpg`}
                alt="YouTube thumbnail"
                className="h-9 w-16 rounded border border-black/10 object-cover"
              />
            ) : (
              <div className="flex h-9 w-16 items-center justify-center rounded border border-black/10 bg-black/[0.04] text-[8px] uppercase tracking-wider text-muted">
                preview
              </div>
            )}
            <span
              className={`text-[10px] ${
                youtubeStatus.kind === 'error'
                  ? 'text-red-600'
                  : youtubeStatus.kind === 'ok'
                  ? 'text-emerald-600'
                  : 'text-muted'
              }`}
            >
              {youtubeStatus.msg}
            </span>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center gap-1.5 border-t border-black/10 px-3.5 py-2.5">
        <button
          onClick={() => onMove(card.id, 'up')}
          disabled={index === 0}
          aria-label="Move up"
          className="flex h-6 w-6 items-center justify-center rounded border border-black/10 text-[10px] leading-none text-muted hover:border-gold/40 hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          ↑
        </button>
        <button
          onClick={() => onMove(card.id, 'down')}
          disabled={index === cards.length - 1}
          aria-label="Move down"
          className="flex h-6 w-6 items-center justify-center rounded border border-black/10 text-[10px] leading-none text-muted hover:border-gold/40 hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          ↓
        </button>
        <button
          onClick={() => onRemove(card.id)}
          className="ml-1 text-[10px] uppercase tracking-wider text-muted hover:text-red-500 transition-colors"
        >
          Remove card
        </button>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg bg-gold px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}