'use client'

import { useRef, useState, type ReactNode } from 'react'
import type { HomeConfig, MediaMeta } from '@/lib/home-config/types'
import { IMAGE_MIME, IMAGE_MAX_BYTES, uploadMedia } from './upload'
import { NumberInput } from './controls'
import { formatAspect, formatBytes } from './controls'

type SetFn = (path: (string | number)[], value: unknown) => void

const MAX_MB = Math.round(IMAGE_MAX_BYTES / 1024 / 1024)
const FORMATS = 'JPG · PNG · WebP · AVIF'

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-black/10 bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-foreground/85">
      {children}
    </span>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <Chip key={c}>{c}</Chip>
      ))}
    </div>
  )
}

function MetaLine({ meta }: { meta?: MediaMeta }) {
  if (!meta) return null
  return (
    <span className="text-[11px] font-medium text-emerald-700">
      {formatAspect(meta.width, meta.height)}
      {meta.width && meta.height ? ` · ${meta.width} × ${meta.height}` : ''}
      {meta.bytes ? ` · ${formatBytes(meta.bytes)}` : ''}
    </span>
  )
}

function UploadButton({
  kind,
  label = 'Replace',
  onUpload,
}: {
  kind: 'hero' | 'portfolio'
  label?: string
  onUpload: (src: string, meta?: MediaMeta) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!IMAGE_MIME.includes(file.type)) {
      setError(`Unsupported type. Use ${FORMATS}.`)
      return
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(`Too large — ${(file.size / 1024 / 1024).toFixed(1)} MB. Max ${MAX_MB} MB.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await uploadMedia(file, kind)
      onUpload(res.src, res.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="min-w-0">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="shrink-0 rounded-lg bg-gold px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {busy ? 'Uploading…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-[11px] leading-snug text-red-500">{error}</p>}
    </div>
  )
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-black/10 text-[10px] leading-none text-muted hover:border-gold/40 hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  )
}

function EditorShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="w-[340px] max-h-[min(680px,calc(100dvh-24px))] flex flex-col rounded-2xl border border-black/10 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-black/10 px-3.5 py-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] leading-none text-black">
            ✎
          </span>
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close editor"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 flex flex-col gap-3">{children}</div>
      {footer}
    </div>
  )
}

/* ----------------------------- Hero section ----------------------------- */

export function HeroSectionEditor({
  config,
  set,
  onClose,
}: {
  config: HomeConfig
  set: SetFn
  onClose: () => void
}) {
  const slides = config.hero.slides
  const addSlide = async (src: string, meta?: MediaMeta) => {
    set(['hero', 'slides'], [...slides, { src, alt: `Hero slide ${slides.length + 1}`, meta, uploaded: true }])
  }

  return (
    <EditorShell
      title="Edit hero images"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between border-t border-black/10 px-3.5 py-2.5 shrink-0">
          <span className="text-[10px] text-muted">{slides.length} image{slides.length === 1 ? '' : 's'}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gold px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light transition-colors"
          >
            Done
          </button>
        </div>
      }
    >
      <Chips
        items={[
          'Big wide banner · 16:9',
          '≈2600px wide max',
          `Max ${MAX_MB} MB`,
          FORMATS,
          'Auto-compressed to WebP',
        ]}
      />
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">
          Auto-transition
        </label>
        <NumberInput
          value={config.hero.interval}
          min={3000}
          max={15000}
          step={500}
          suffix="ms"
          onChange={(v) => set(['hero', 'interval'], v)}
        />
      </div>

      {slides.map((slide, i) => (
        <div key={i} className="rounded-lg border border-black/10 p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-12 w-20 shrink-0 rounded-md border border-black/10 bg-black/5 object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-foreground/85">Slide {i + 1}</span>
              <span className="truncate text-[10px] text-muted">{slide.src}</span>
              <MetaLine meta={slide.meta} />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <IconBtn
                label="Move up"
                disabled={i === 0}
                onClick={() => {
                  const n = swapArr(slides, i, -1)
                  if (n) set(['hero', 'slides'], n)
                }}
              >
                ↑
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={i === slides.length - 1}
                onClick={() => {
                  const n = swapArr(slides, i, 1)
                  if (n) set(['hero', 'slides'], n)
                }}
              >
                ↓
              </IconBtn>
              <IconBtn
                label="Remove slide"
                disabled={slides.length <= 1}
                onClick={() => set(['hero', 'slides'], slides.filter((_, idx) => idx !== i))}
              >
                ✕
              </IconBtn>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadButton
              kind="hero"
              onUpload={(src, meta) => set(['hero', 'slides', i], { ...slide, src, meta, uploaded: true })}
            />
            <input
              value={slide.alt}
              onChange={(e) => set(['hero', 'slides', i, 'alt'], e.target.value)}
              placeholder="Alt text"
              className="min-w-0 flex-1 rounded-md border border-black/10 px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
            />
          </div>
        </div>
      ))}

      <UploadButton kind="hero" label="+ Add image" onUpload={addSlide} />
    </EditorShell>
  )
}

/* --------------------------- Portfolio section --------------------------- */

export function PortfolioSectionEditor({
  config,
  set,
  onClose,
}: {
  config: HomeConfig
  set: SetFn
  onClose: () => void
}) {
  const images = config.portfolio.images
  const addImage = (src: string, meta?: MediaMeta) => {
    set(['portfolio', 'images'], [
      ...images,
      {
        id: `up${Date.now()}`,
        src,
        alt: `Wedding photo ${images.length + 1}`,
        width: meta?.width ?? 800,
        height: meta?.height ?? 800,
        meta,
        uploaded: true,
      },
    ])
  }

  return (
    <EditorShell
      title="Edit portfolio images"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between border-t border-black/10 px-3.5 py-2.5 shrink-0">
          <span className="text-[10px] text-muted">{images.length} image{images.length === 1 ? '' : 's'}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gold px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-gold-light transition-colors"
          >
            Done
          </button>
        </div>
      }
    >
      <Chips
        items={[
          'Square to 3:2',
          '≈1600px wide max',
          `Max ${MAX_MB} MB`,
          FORMATS,
          'Auto-compressed to WebP',
        ]}
      />

      {images.map((img, i) => (
        <div key={img.id} className="rounded-lg border border-black/10 p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="h-12 w-12 shrink-0 rounded-md border border-black/10 bg-black/5 object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[11px] font-semibold text-foreground/85">
                {String(i + 1).padStart(2, '0')} · {img.alt}
              </span>
              <span className="truncate text-[10px] text-muted">{img.src}</span>
              <MetaLine meta={img.meta} />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <IconBtn
                label="Move up"
                disabled={i === 0}
                onClick={() => {
                  const n = swapArr(images, i, -1)
                  if (n) set(['portfolio', 'images'], n)
                }}
              >
                ↑
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={i === images.length - 1}
                onClick={() => {
                  const n = swapArr(images, i, 1)
                  if (n) set(['portfolio', 'images'], n)
                }}
              >
                ↓
              </IconBtn>
              <IconBtn
                label="Remove image"
                disabled={images.length <= 1}
                onClick={() => set(['portfolio', 'images'], images.filter((_, idx) => idx !== i))}
              >
                ✕
              </IconBtn>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadButton
              kind="portfolio"
              onUpload={(src, meta) =>
                set(['portfolio', 'images', i], { ...img, src, meta, uploaded: true })
              }
            />
            <input
              value={img.alt}
              onChange={(e) => set(['portfolio', 'images', i, 'alt'], e.target.value)}
              placeholder="Alt text"
              className="min-w-0 flex-1 rounded-md border border-black/10 px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
            />
          </div>
        </div>
      ))}

      <UploadButton kind="portfolio" label="+ Add image" onUpload={addImage} />
    </EditorShell>
  )
}

function swapArr<T>(arr: T[], i: number, dir: number): T[] | null {
  const target = i + dir
  if (target < 0 || target >= arr.length) return null
  const next = [...arr]
  const [item] = next.splice(i, 1)
  next.splice(target, 0, item)
  return next
}

/* --------------------------- Info only sidebar --------------------------- */

export function CanvasInfoPanel({
  kind,
  config,
}: {
  kind: 'hero' | 'portfolio'
  config: HomeConfig
}) {
  const isHero = kind === 'hero'
  const count = isHero ? config.hero.slides.length : config.portfolio.images.length
  const specs = isHero
    ? ['16:9 wide banner', 'up to ≈2600px wide', `max ${MAX_MB} MB`, FORMATS]
    : ['square to 3:2', 'up to ≈1600px wide', `max ${MAX_MB} MB`, FORMATS]

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-gold/25 bg-gold/[0.06] px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark">
          How to edit
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/80">
          {isHero
            ? 'Hover the top banner in the preview and click it. Each slide is edited inline — replace, reorder or remove images there.'
            : 'Click the portfolio in the preview. Images are edited inline — replace, reorder or remove each photo right there.'}
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white/70 px-3.5 py-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Current content</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {count} image{count === 1 ? '' : 's'}
        </p>
        {isHero && (
          <p className="mt-0.5 text-[11px] text-muted">
            Slides auto-rotate every {Math.round(config.hero.interval / 1000)}s
          </p>
        )}
      </div>

      <div className="rounded-xl border border-black/10 bg-white/70 px-3.5 py-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Image specs</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          Large files are automatically compressed to lightweight WebP so your gallery
          stays fast.
        </p>
      </div>
    </div>
  )
}