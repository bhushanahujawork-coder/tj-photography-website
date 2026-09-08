'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IMAGE_MIME,
  IMAGE_MAX_BYTES,
  uploadMedia,
  VIDEO_MAX_BYTES,
  VIDEO_MIME,
} from './upload'
import type { MediaMeta } from '@/lib/home-config/types'

export function formatBytes(bytes?: number): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDuration(seconds?: number): string {
  if (seconds == null) return ''
  const total = Math.max(0, Math.floor(seconds))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function formatMeta(meta?: MediaMeta): string {
  if (!meta) return ''
  const parts: string[] = []
  if (meta.width && meta.height) parts.push(`${meta.width} × ${meta.height}`)
  if (meta.format) parts.push(meta.format.toUpperCase())
  if (meta.bytes) parts.push(formatBytes(meta.bytes))
  if (meta.duration) parts.push(formatDuration(meta.duration))
  return parts.join(' · ')
}

const ASPECT_STOPS: [number, string][] = [
  [21 / 9, '21:9'],
  [16 / 9, '16:9'],
  [3 / 2, '3:2'],
  [4 / 3, '4:3'],
  [1, '1:1'],
  [3 / 4, '3:4'],
  [2 / 3, '2:3'],
  [9 / 16, '9:16'],
]

export function formatAspect(width?: number, height?: number): string {
  if (!width || !height) return ''
  const ratio = width / height
  let best: { v: string; d: number } | null = null
  for (const [r, v] of ASPECT_STOPS) {
    const d = Math.abs(Math.log(ratio / r))
    if (!best || d < best.d) best = { v, d }
  }
  if (best && best.d < 0.08) return best.v
  return `${ratio.toFixed(2)}:1`
}

const metaCache = new Map<string, MediaMeta | null>()

export function useMediaMeta(src: string | undefined, isVideo: boolean): MediaMeta | null | undefined {
  const [loaded, setLoaded] = useState<{ src: string; meta: MediaMeta | null } | null>(null)

  useEffect(() => {
    if (!src) return
    if (metaCache.has(src)) return
    let cancelled = false
    fetch(`/api/home-config/media-info?src=${encodeURIComponent(src)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const m: MediaMeta | null = data?.meta ?? null
        metaCache.set(src, m)
        if (!cancelled) setLoaded({ src, meta: m })
      })
      .catch(() => {
        metaCache.set(src, null)
        if (!cancelled) setLoaded({ src, meta: null })
      })
    return () => {
      cancelled = true
    }
  }, [src, isVideo])

  if (!src) return undefined
  const loadedMeta = loaded && loaded.src === src ? loaded.meta : undefined
  if (loadedMeta !== undefined) return loadedMeta
  return metaCache.get(src) ?? undefined
}

export function MediaInfoLine({ src, isVideo, meta }: { src?: string; isVideo?: boolean; meta?: MediaMeta }) {
  const probed = useMediaMeta(src, !!isVideo)
  const m = meta ?? probed
  if (!m) return null
  return <span className="text-[11px] text-muted">{formatMeta(m)}</span>
}

export function Card({
  title,
  onReset,
  children,
  hint,
  id,
  focused,
}: {
  title: string
  onReset?: () => void
  children: ReactNode
  hint?: string
  id?: string
  focused?: boolean
}) {
  return (
    <div
      data-focus-id={id}
      className={`rounded-xl border bg-white/70 shadow-sm overflow-hidden scroll-mt-2 transition-shadow ${
        focused ? 'border-gold/60 ring-2 ring-gold/30' : 'border-black/10'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-black/[0.02]">
        <div className="flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/80">
            {title}
          </h3>
          {hint && <span className="text-[10px] text-muted mt-0.5">{hint}</span>}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-[11px] uppercase tracking-wider text-muted hover:text-gold-dark transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition'

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      className={`${inputCls} resize-y`}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Decrease"
        className="w-8 h-8 shrink-0 rounded-lg border border-black/10 bg-white text-muted hover:border-gold/40 hover:text-gold-dark transition-colors"
        onClick={() => onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value - step)))}
      >
        −
      </button>
      <input
        type="number"
        className={`${inputCls} text-center`}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(n)
        }}
      />
      <button
        aria-label="Increase"
        className="w-8 h-8 shrink-0 rounded-lg border border-black/10 bg-white text-muted hover:border-gold/40 hover:text-gold-dark transition-colors"
        onClick={() => onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value + step)))}
      >
        +
      </button>
      {suffix && <span className="text-xs text-muted w-6">{suffix}</span>}
    </div>
  )
}

export function RangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="flex-1 accent-gold"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="text-xs text-foreground/80 w-14 text-right tabular-nums">
        {value}
        {suffix ?? ''}
      </span>
    </div>
  )
}

export function ColorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
      />
      <input
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '#000000'}
        spellCheck={false}
      />
    </div>
  )
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function InlineAlert({ tone, children }: { tone: 'warn' | 'info'; children: ReactNode }) {
  return (
    <p
      className={`text-[11px] leading-relaxed ${
        tone === 'warn' ? 'text-amber-600' : 'text-muted'
      }`}
    >
      {children}
    </p>
  )
}

/** Single readout row: uppercase label + value. */
export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-black/5 bg-black/[0.03] px-2.5 py-1.5 min-w-0">
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted truncate">{label}</span>
      <span className="text-[11px] font-medium text-foreground/90 tabular-nums truncate">{value}</span>
    </div>
  )
}

export function MediaSpecs({
  src,
  isVideo = false,
  meta,
}: {
  src?: string
  isVideo?: boolean
  meta?: MediaMeta
}) {
  const probed = useMediaMeta(src, isVideo)
  const m = meta ?? probed
  if (!m) return null
  const rows = [
    { label: 'Width', value: m.width ? `${m.width}px` : '—' },
    { label: 'Height', value: m.height ? `${m.height}px` : '—' },
    { label: 'Aspect ratio', value: formatAspect(m.width, m.height) || '—' },
    { label: 'Format', value: (m.format || '—').toUpperCase() },
    { label: 'File size', value: formatBytes(m.bytes) || '—' },
  ]
  if (isVideo || m.duration) rows.push({ label: 'Duration', value: formatDuration(m.duration) || '—' })
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Current</p>
      <div className="grid grid-cols-2 gap-1.5">
        {rows.map((r) => (
          <Readout key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  )
}

export function RecommendNote({ text }: { text: string }) {
  return (
    <p className="text-[10px] leading-relaxed text-muted">
      <span className="font-semibold uppercase tracking-[0.12em] text-gold-dark">Recommended:</span> {text}
    </p>
  )
}

export function MediaBox({
  label,
  src,
  isVideo = false,
  onReplace,
  onReset,
  kind,
  recommended,
  meta,
  hint,
  large = false,
}: {
  label: string
  src: string
  isVideo?: boolean
  onReplace: (src: string, meta?: MediaMeta) => void
  onReset: () => void
  kind: 'logo' | 'hero' | 'portfolio' | 'poster' | 'video'
  recommended?: string
  meta?: MediaMeta
  hint?: string
  large?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current)
  }, [])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const allowed = isVideo ? VIDEO_MIME : IMAGE_MIME
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
    if (!allowed.includes(file.type)) {
      setError(
        `Unsupported file type (${file.type || 'unknown'}). ${
          isVideo ? 'Use MP4, WebM or MOV.' : 'Use JPG, PNG, WebP or AVIF.'
        }`
      )
      return
    }
    if (file.size > maxBytes) {
      setError(
        `File too large — ${(file.size / (1024 * 1024)).toFixed(1)} MB. Max ${Math.round(maxBytes / 1024 / 1024)} MB.`
      )
      return
    }
    if (successTimer.current) clearTimeout(successTimer.current)
    setBusy(true)
    setError('')
    setUploaded(false)
    try {
      const res = await uploadMedia(file, kind)
      onReplace(res.src, res.meta)
      setUploaded(true)
      successTimer.current = setTimeout(() => setUploaded(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {large ? (
        <div className="w-full aspect-video rounded-lg border border-black/10 bg-black/5 overflow-hidden relative">
          {src ? (
            isVideo ? (
              <video key={src} className="absolute inset-0 w-full h-full object-cover" src={src} muted preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            )
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted">
              empty
            </span>
          )}
        </div>
      ) : null}
      <div className={`${large ? 'flex items-center justify-between gap-3' : 'flex items-center gap-3'}`}>
        {!large ? (
          <div className="w-16 h-16 shrink-0 rounded-lg border border-black/10 bg-black/5 overflow-hidden flex items-center justify-center">
            {src ? (
              isVideo ? (
                <span className="text-[9px] uppercase tracking-wider text-muted">video</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={label} className="w-full h-full object-cover" />
              )
            ) : (
              <span className="text-[9px] uppercase tracking-wider text-muted">empty</span>
            )}
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-foreground/80 truncate">{label}</p>
            {busy && <span className="shrink-0 text-[10px] uppercase tracking-wider text-gold-dark animate-pulse">Uploading…</span>}
            {!busy && uploaded && (
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-emerald-600">Uploaded ✓</span>
            )}
          </div>
          <p className="text-[10px] text-muted truncate mt-0.5">{src || 'No media'}</p>
        </div>
        <div className={`${large ? 'flex items-center gap-1.5 shrink-0' : 'flex flex-col gap-1.5 shrink-0'}`}>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="text-[11px] uppercase tracking-wider bg-gold text-black rounded-lg px-3 py-1.5 font-semibold hover:bg-gold-light disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {busy ? 'Uploading…' : 'Replace'}
          </button>
          <button
            onClick={onReset}
            className="text-[11px] uppercase tracking-wider border border-black/10 text-muted rounded-lg px-3 py-1.5 hover:border-gold/40 transition-colors whitespace-nowrap"
          >
            Reset
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/avif'}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>
      {recommended && (
        <p className="text-[10px] uppercase tracking-wide text-muted">Recommended: {recommended}</p>
      )}
      <MediaInfoLine src={src} isVideo={isVideo} meta={meta} />
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}