'use client'

import type {
  FooterSocialConfig,
  HomeConfig,
  NavLinkCfg,
  ReviewConfig,
  SectionId,
  WhileWidth,
} from '@/lib/home-config/types'
import {
  MAX_NAV_LINKS,
  clearLogoOverride,
  clearNavOverride,
  isValidHref,
  setLogoValue,
  setNavOffset,
  widthClassOf,
  withLogoOverride,
  withNavOverride,
} from '@/lib/home-config/shared'
import { LOGO_ASPECT, logoWidthAt } from '@/lib/home-config/responsive'
import { FILM_ASPECTS, type FilmCard, type FilmAspect } from '@/lib/home-config/types'
import { youtubeIdFromInput } from '@/lib/home-config/shared'
import {
  Card,
  ColorInput,
  Field,
  InlineAlert,
  MediaBox,
  MediaSpecs,
  NumberInput,
  RangeInput,
  RecommendNote,
  SelectInput,
  TextArea,
  TextInput,
} from './controls'
import HeaderPreview from './header-preview'

export type PanelProps = {
  config: HomeConfig
  set: (path: (string | number)[], value: unknown) => void
  reset: (path: (string | number)[]) => void
  previewWidth: number
  focusTarget?: string | null
  setFocus?: (id: string | null) => void
}

function moveArr<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from === to) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function ArrowBtn({ dir, onClick, disabled }: { dir: 'up' | 'down'; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      aria-label={dir === 'up' ? 'Move up' : 'Move down'}
      disabled={disabled}
      onClick={onClick}
      className="w-6 h-6 shrink-0 rounded border border-black/10 text-muted hover:border-gold/40 hover:text-gold-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px] leading-none"
    >
      {dir === 'up' ? '\u2191' : '\u2193'}
    </button>
  )
}

function HelperNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] leading-relaxed text-muted">{children}</p>
}

/* ----------------------------- Header ----------------------------- */

function OverrideToggle({
  label,
  checked,
  onToggle,
  control,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  control: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-3.5 w-3.5 shrink-0 accent-gold-dark"
      />
      <span className="w-[176px] shrink-0 text-[11px] text-foreground/80">{label}</span>
      <div className="flex-1">{checked ? control : <span className="text-[10px] text-muted">inherits the base value</span>}</div>
    </div>
  )
}

const WIDTH_RANGE_LABEL: Record<WhileWidth, string> = {
  mobile: 'Mobile · below 768px',
  tablet: 'Tablet · 768–1023px',
}

export function HeaderPanel({ config, set, reset, previewWidth, focusTarget }: PanelProps) {
  const h = config.header
  const pv = previewWidth
  const k = widthClassOf(pv)
  const ov = k !== 'desktop' ? h.overrides?.[k] : null
  const effX = ov?.logo?.x ?? h.logo.x
  const effY = ov?.logo?.y ?? h.logo.y
  const effSize = ov?.logo?.size ?? logoWidthAt(h.logo.size, pv)
  const effOffset = ov?.nav?.offset ?? h.nav.offset
  const kLabel = k === 'mobile' ? 'Mobile' : k === 'tablet' ? 'Tablet' : 'Desktop'
  const autoHeight = Math.max(1, Math.round(effSize / LOGO_ASPECT))
  const aspectLabel = `${LOGO_ASPECT.toFixed(2)} : 1`

  const commitHeader = (next: HomeConfig) => set(['header'], next.header)
  const commitLogo = (field: 'x' | 'y' | 'size', value: number) => commitHeader(setLogoValue(config, pv, field, value))
  const commitOffset = (value: number) => commitHeader(setNavOffset(config, pv, value))

  const hasOv = (kk: WhileWidth, field: 'x' | 'y' | 'size') => h.overrides?.[kk]?.logo?.[field] != null
  const toggleOv = (kk: WhileWidth, field: 'x' | 'y' | 'size') =>
    set(['header'], hasOv(kk, field) ? clearLogoOverride(h, kk, field) : withLogoOverride(h, kk, field, h.logo[field]))
  const hasNavOv = (kk: WhileWidth) => h.overrides?.[kk]?.nav?.offset != null
  const toggleNavOv = (kk: WhileWidth) =>
    set(['header'], hasNavOv(kk) ? clearNavOverride(h, kk) : withNavOverride(h, kk, 'offset', h.nav.offset))

  const linkPath = (i: number, key: 'label' | 'href') => ['header', 'nav', 'links', i, key]
  const canAdd = h.nav.links.length < MAX_NAV_LINKS

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] leading-relaxed text-foreground/65">
        One logo value scales fluidly across every screen width — set it once, drag it in the preview, done.
        The previewing width below only changes what you <em>see</em>, never what you <em>edit</em>.
      </p>

      <Card
        id="header-preview"
        title="Header preview"
        hint={`Replicates the real navbar at ${pv}px — drag here or in the centre preview. Base values scale fluidly.`}
      >
        <HeaderPreview
          header={h}
          width={pv}
          onChangeLogo={(patch) => {
            let next = config
            if (patch.x != null) next = setLogoValue(next, pv, 'x', patch.x)
            if (patch.y != null) next = setLogoValue(next, pv, 'y', patch.y)
            if (patch.size != null) next = setLogoValue(next, pv, 'size', patch.size)
            commitHeader(next)
          }}
          onChangeNav={(patch) => {
            let next = config
            if (patch.offset != null) next = setNavOffset(next, pv, patch.offset)
            commitHeader(next)
          }}
        />
      </Card>

      <Card
        id="header-logo"
        title="Logo"
        focused={focusTarget === 'header-logo'}
        onReset={() => reset(['header', 'logo'])}
        hint="Base values apply at every width — the logo scales smoothly between the smallest and largest screens."
      >
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
            At {pv}px ({kLabel}) · {ov?.logo ? 'a width override is active on ' + kLabel : 'fluid value from the base'}
          </span>
          <span className="text-[11px] tabular-nums text-foreground/90">
            X {effX}px · Y {effY}px · Width {effSize}px
          </span>
          <span className="text-[11px] tabular-nums text-foreground/60">
            Auto height ≈ {autoHeight}px · ratio {aspectLabel} · base width {h.logo.size}px
          </span>
          <RecommendNote text="Size = logo width. Height stays automatic so the wordmark is never stretched, distorted or cropped." />
        </div>

        <MediaBox
          label="Logo image"
          src={h.logo.src}
          kind="logo"
          recommended="Transparent PNG · wide wordmark"
          meta={h.logo.meta}
          onReplace={(src, meta) => set(['header', 'logo'], { ...h.logo, src, meta, uploaded: true })}
          onReset={() => reset(['header', 'logo'])}
        />
        <MediaSpecs src={h.logo.src} meta={h.logo.meta} />

        <div className="flex flex-col gap-3">
          <Field label="X position (px) — base">
            <NumberInput value={h.logo.x} min={4} max={1200} onChange={(v) => commitLogo('x', v)} suffix="px" />
          </Field>
          <Field label="Y position (px) — base">
            <NumberInput value={h.logo.y} min={-60} max={60} onChange={(v) => commitLogo('y', v)} suffix="px" />
          </Field>
          <Field label="Width (px) — base">
            <NumberInput value={h.logo.size} min={24} max={600} onChange={(v) => commitLogo('size', v)} suffix="px" />
          </Field>
        </div>
        <p className="text-[11px] text-foreground/65">
          Editing at {pv}px {ov?.logo ? 'writes the ' + kLabel + ' override (active at this width)' : 'updates the base value for every width'}.
        </p>

        <details className="group mt-1 rounded-lg border border-black/10 bg-black/[0.02] p-3">
          <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/75 marker:hidden">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
            Advanced · per-width overrides
          </summary>
          <div className="mt-3 flex flex-col gap-4">
            {(['mobile', 'tablet'] as WhileWidth[]).map((kk) => (
              <div key={kk} className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">{WIDTH_RANGE_LABEL[kk]}</span>
                <OverrideToggle
                  label="Use a different width"
                  checked={hasOv(kk, 'size')}
                  onToggle={() => toggleOv(kk, 'size')}
                  control={
                    <NumberInput value={h.overrides?.[kk]?.logo?.size ?? h.logo.size} min={24} max={600} onChange={(v) => set(['header'], withLogoOverride(h, kk, 'size', v))} suffix="px" />
                  }
                />
                <OverrideToggle
                  label="Use a different position"
                  checked={hasOv(kk, 'x') || hasOv(kk, 'y')}
                  onToggle={() => toggleOv(kk, 'x')}
                  control={
                    <div className="flex items-center gap-1.5">
                      <NumberInput value={h.overrides?.[kk]?.logo?.x ?? h.logo.x} min={4} max={1200} onChange={(v) => set(['header'], withLogoOverride(h, kk, 'x', v))} suffix="px" />
                      <NumberInput value={h.overrides?.[kk]?.logo?.y ?? h.logo.y} min={-60} max={60} onChange={(v) => set(['header'], withLogoOverride(h, kk, 'y', v))} suffix="px" />
                    </div>
                  }
                />
                <OverrideToggle
                  label="Use a different menu offset"
                  checked={hasNavOv(kk)}
                  onToggle={() => toggleNavOv(kk)}
                  control={<NumberInput value={h.overrides?.[kk]?.nav?.offset ?? h.nav.offset} min={-800} max={800} onChange={(v) => set(['header'], withNavOverride(h, kk, 'offset', v))} suffix="px" />}
                />
              </div>
            ))}
          </div>
        </details>
      </Card>

      <Card
        id="header-nav"
        title="Navigation"
        focused={focusTarget === 'header-nav'}
        hint="Position + link spacing · max 5 links · links are shared across every width"
      >
        <Field label="Navigation position (horizontal offset) — base">
          <NumberInput value={h.nav.offset} min={-800} max={800} onChange={(v) => commitOffset(v)} suffix="px" />
        </Field>
        <HelperNote>
          -14 keeps the links at the right edge (default). At {pv}px this renders as {effOffset}px
          {ov?.nav?.offset ? ` (${kLabel} override in use)` : ' (fluid from the base)'}.
        </HelperNote>
        <Field label="Link spacing (px) — base">
          <NumberInput value={h.nav.spacing} min={8} max={96} onChange={(v) => set(['header', 'nav', 'spacing'], v)} suffix="px" />
        </Field>
        <HelperNote>Default 32px matches the original design. Below 1024px the links collapse into the hamburger menu.</HelperNote>

        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
            Navigation links · shared across all widths
          </span>
          <div className="flex items-center flex-wrap gap-1.5">
            {h.nav.links.map((l, i) => (
              <span
                key={i}
                className="rounded-md bg-black/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70"
              >
                #{i + 1} {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {h.nav.links.map((link: NavLinkCfg, i: number) => {
            const hrefValid = isValidHref(link.href)
            return (
              <div key={i} className="rounded-lg border border-black/10 bg-black/[0.02] p-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-6 shrink-0 tabular-nums">#{i + 1}</span>
                  <TextInput
                    value={link.label}
                    onChange={(v) => set(linkPath(i, 'label'), v)}
                    placeholder="Label"
                  />
                  <ArrowBtn dir="up" disabled={i === 0} onClick={() => set(['header', 'nav', 'links'], moveArr(h.nav.links, i, i - 1))} />
                  <ArrowBtn
                    dir="down"
                    disabled={i === h.nav.links.length - 1}
                    onClick={() => set(['header', 'nav', 'links'], moveArr(h.nav.links, i, i + 1))}
                  />
                  <button
                    aria-label="Remove link"
                    className="w-8 h-8 shrink-0 rounded-lg border border-black/10 text-muted hover:text-red-500 hover:border-red-300 transition-colors"
                    onClick={() => set(['header', 'nav', 'links'], h.nav.links.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-6 shrink-0" />
                  <TextInput value={link.href} onChange={(v) => set(linkPath(i, 'href'), v)} placeholder="#section, /page or https://…" />
                  {!hrefValid && (
                    <span className="text-[10px] text-amber-600 shrink-0 whitespace-nowrap" title="Invalid href — start with #, /, tel:, mailto: or http(s)://">
                      ⚠ url
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {!canAdd && (
            <InlineAlert tone="info">Maximum {MAX_NAV_LINKS} navigation links reached. Remove one before adding another.</InlineAlert>
          )}
          <button
            disabled={!canAdd}
            className="self-start text-[11px] uppercase tracking-wider text-gold-dark font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
            onClick={() => set(['header', 'nav', 'links'], [...h.nav.links, { label: 'New Link', href: '/' }])}
          >
            + Add link
          </button>
        </div>
      </Card>
    </div>
  )
}

/* ----------------------------- Global ----------------------------- */

export function GlobalPanel({ config, set, reset }: PanelProps) {
  const g = config.global
  return (
    <div className="flex flex-col gap-4">
      <Card id="global-bg" title="Background colour" onReset={() => reset(['global', 'background'])} hint="Used across the whole website behind every section.">
        <ColorInput value={g.background} onChange={(v) => set(['global', 'background'], v)} placeholder="#eae1d2" />
        <InlineAlert tone="info">
          Sections with their own intentional background (hero film, dark cinema band) keep their design — this colour fills the site behind everything.
        </InlineAlert>
      </Card>

      <Card title="Background noise / grain" onReset={() => reset(['global', 'noise'])} hint="Default 5% — subtle, premium film grain (0–30%).">
        <RangeInput value={g.noise} min={0} max={30} onChange={(v) => set(['global', 'noise'], v)} suffix="%" />
        <InlineAlert tone="info">
          Lightweight SVG grain overlay — no image files are generated or loaded. 5% is the recommended setting.
        </InlineAlert>
      </Card>
    </div>
  )
}

/* -------------------------- Section order -------------------------- */

const LABELS: Record<SectionId, string> = {
  header: 'Header',
  hero: 'Hero',
  soulCinema: 'Soul Cinema',
  portfolio: 'Portfolio',
  reviews: 'Reviews',
  contact: 'Contact',
  footer: 'Footer',
}

export function SectionOrderPanel({ config, set }: PanelProps) {
  const order = config.sectionOrder ?? []
  const isLocked = (id: SectionId) => id === 'header' || id === 'footer'

  return (
    <div className="flex flex-col gap-4">
      <Card id="section-order" title="Section order" hint="Header is always first; Footer always last.">
        <div className="flex flex-col gap-1.5">
          {order.map((id: SectionId, i: number) => {
            const locked = isLocked(id)
            return (
              <div
                key={id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  locked ? 'border-black/10 bg-black/[0.03]' : 'border-black/10 bg-white'
                }`}
              >
                <span className="w-4 text-[10px] text-muted tabular-nums text-right">{i + 1}</span>
                <span className="flex-1 text-xs font-medium text-foreground/85">{LABELS[id]}</span>
                {locked ? (
                  <span className="text-[9px] uppercase tracking-wider text-muted">locked</span>
                ) : (
                  <div className="flex gap-1">
                    <ArrowBtn dir="up" disabled={i === 0} onClick={() => set(['sectionOrder'], moveArr(order, i, i - 1))} />
                    <ArrowBtn dir="down" disabled={i === order.length - 1} onClick={() => set(['sectionOrder'], moveArr(order, i, i + 1))} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
      <InlineAlert tone="info">
        WhatsApp Float is a global page element — it stays fixed and is never reordered. Changes apply to the draft only; publish to go live.
      </InlineAlert>
    </div>
  )
}

/* ----------------------------- Hero ----------------------------- */

export function HeroPanel({ config, set, reset, focusTarget }: PanelProps) {
  const hero = config.hero
  return (
    <div className="flex flex-col gap-4">
      <Card id="hero-config" title="Auto-transition" onReset={() => reset(['hero', 'interval'])}>
        <Field label="Seconds between slides">
          <NumberInput
            value={hero.interval}
            min={2000}
            max={15000}
            step={500}
            onChange={(v) => set(['hero', 'interval'], v)}
            suffix="ms"
          />
        </Field>
      </Card>

      <div data-focus-id="hero-images" className="flex flex-col gap-4 scroll-mt-2">
        {hero.slides.map((slide, i) => (
          <Card
            key={i}
            id={`hero-slide-${i}`}
            focused={focusTarget === 'hero-images'}
            title={`Hero image ${i + 1}`}
            onReset={() => reset(['hero', 'slides', i])}
            hint="Full-bleed background — partially darkened by the design."
          >
            <MediaBox
              large
              label="Background image"
              src={slide.src}
              kind="hero"
              recommended="1920 × 1080 px · 16:9 wide"
              meta={slide.meta}
              hint="JPG and PNG uploads are accepted. Images are automatically optimized to WebP."
              onReplace={(src, meta) => set(['hero', 'slides', i], { ...slide, src, meta, uploaded: true })}
              onReset={() => reset(['hero', 'slides', i])}
            />
            <MediaSpecs src={slide.src} meta={slide.meta} />
            <Field label="Alt text">
              <TextInput value={slide.alt} onChange={(v) => set(['hero', 'slides', i, 'alt'], v)} />
            </Field>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- Soul Cinema --------------------------- */

export function SoulCinemaPanel({ config, set, reset, focusTarget }: PanelProps) {
  const sc = config.soulCinema
  const ty = sc.type ?? {}
  const typePath =
    (key: string) =>
    (v: unknown) =>
      set(['soulCinema', 'type', key], v)

  return (
    <div className="flex flex-col gap-4">
      <Card title="Text" onReset={() => reset(['soulCinema', 'eyebrow'])}>
        <Field label="Eyebrow">
          <TextInput value={sc.eyebrow} onChange={(v) => set(['soulCinema', 'eyebrow'], v)} />
        </Field>
        <Field label="Title">
          <TextInput value={sc.title} onChange={(v) => set(['soulCinema', 'title'], v)} />
        </Field>
        <Field label="Description">
          <TextArea value={sc.description} onChange={(v) => set(['soulCinema', 'description'], v)} />
        </Field>
      </Card>

      <Card
        title="Typography (optional)"
        onReset={() => reset(['soulCinema', 'type'])}
        hint="Leave empty to keep the existing website styling."
      >
        <Field label="Font family">
          <TextInput value={ty.fontFamily ?? ''} onChange={typePath('fontFamily')} placeholder="Leave empty = inherited" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title size (rem)">
            <NumberInput value={ty.titleSize ?? 0} min={0} max={12} step={0.5} onChange={typePath('titleSize')} suffix="rem" />
          </Field>
          <Field label="Title weight">
            <NumberInput value={ty.titleWeight ?? 0} min={0} max={900} step={100} onChange={typePath('titleWeight')} suffix="" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title colour">
            <ColorInput value={ty.titleColor ?? ''} onChange={typePath('titleColor')} placeholder="Inherit" />
          </Field>
          <Field label="Body size (rem)">
            <NumberInput value={ty.bodySize ?? 0} min={0} max={8} step={0.25} onChange={typePath('bodySize')} suffix="rem" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Body colour">
            <ColorInput value={ty.bodyColor ?? ''} onChange={typePath('bodyColor')} placeholder="Inherit" />
          </Field>
          <Field label="Accent colour (line)">
            <ColorInput value={ty.accent ?? ''} onChange={typePath('accent')} placeholder="Inherit" />
          </Field>
        </div>
      </Card>

      <Card
        id="soulCinema-media"
        focused={focusTarget === 'soulCinema-media'}
        title="Video"
        onReset={() => reset(['soulCinema', 'videoSrc'])}
        hint="Web-compatible MP4/H.264 with fast-start — never converted to WebP."
      >
        <MediaBox
          large
          label="Wedding film"
          src={sc.videoSrc}
          isVideo
          kind="video"
          recommended="1920 × 1080 px · 16:9"
          meta={sc.videoMeta}
          hint="MP4/WebM/MOV max 100MB — re-encoded to MP4/H.264 with fast-start for instant playback."
          onReplace={(src, meta) => {
            set(['soulCinema'], {
              ...sc,
              videoSrc: src,
              videoUploaded: true,
              videoMeta: meta,
            })
          }}
          onReset={() => {
            reset(['soulCinema', 'videoSrc'])
            set(['soulCinema', 'videoMeta'], undefined)
            set(['soulCinema', 'videoUploaded'], false)
          }}
        />
        <MediaSpecs src={sc.videoSrc} isVideo meta={sc.videoMeta} />
        <RecommendNote text="1920 × 1080 px · 16:9. MP4/H.264 with fast-start optimised for instant playback." />
        <Field label="Letterbox frame around the video">
          <SelectInput
            value={sc.frame}
            onChange={(v) => set(['soulCinema', 'frame'], v)}
            options={[
              { value: 'global', label: 'Global background (cream + grain)' },
              { value: 'black', label: 'Cinematic black' },
            ]}
          />
        </Field>
      </Card>

      <Card
        id="soulCinema-poster"
        title="Poster image"
        onReset={() => reset(['soulCinema', 'poster'])}
        hint="Shown immediately while the film loads."
      >
        <MediaBox
          large
          label="Poster"
          src={sc.poster}
          kind="poster"
          recommended="1920 × 1080 px · 16:9"
          meta={sc.posterMeta}
          onReplace={(src, meta) => set(['soulCinema'], { ...sc, poster: src, posterUploaded: true, posterMeta: meta })}
          onReset={() => {
            reset(['soulCinema', 'poster'])
            set(['soulCinema', 'posterMeta'], undefined)
            set(['soulCinema', 'posterUploaded'], false)
          }}
        />
        <MediaSpecs src={sc.poster} meta={sc.posterMeta} />
        <RecommendNote text="Use the same frame as the video — 1920 × 1080 px works best." />
      </Card>
    </div>
  )
}

/* ---------------------------- Portfolio ---------------------------- */

function PortfolioGrid({
  images,
  onSelect,
}: {
  images: HomeConfig['portfolio']['images']
  onSelect: (i: number) => void
}) {
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[2px] bg-black/10">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onSelect(i)}
            className={`relative aspect-square bg-black overflow-hidden group focus:outline-none focus:ring-2 focus:ring-gold ${
              i === 14 ? 'col-span-2 md:col-span-1' : ''
            }`}
            aria-label={`Open settings for portfolio image ${i + 1}`}
          >
            {img.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] leading-tight text-white/85 bg-black/70">
                {img.overlay ?? ''}
              </span>
            )}
            <span className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[8px] text-white/90 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] uppercase tracking-[0.15em] text-white/90">
              Open settings
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function PortfolioPanel({ config, set, reset, focusTarget, setFocus }: PanelProps) {
  const p = config.portfolio
  const imgPath = (i: number, key: string) => ['portfolio', 'images', i, key]

  return (
    <div className="flex flex-col gap-4">
      <Card
        id="portfolio-visual"
        focused={focusTarget === 'portfolio-visual'}
        title="Visual layout"
        hint="Matches the real homepage masonry exactly — click a tile to open its settings."
      >
        <PortfolioGrid images={p.images} onSelect={(i) => setFocus?.(`portfolio-img-${i}`)} />
      </Card>

      <Card id="portfolio-heading" title="Section heading" onReset={() => reset(['portfolio', 'headingTitle'])}>
        <Field label="Title">
          <TextInput value={p.headingTitle} onChange={(v) => set(['portfolio', 'headingTitle'], v)} />
        </Field>
        <Field label="Description">
          <TextInput value={p.headingDescription} onChange={(v) => set(['portfolio', 'headingDescription'], v)} />
        </Field>
      </Card>

      {p.images.map((img, i) => (
        <Card
          key={img.id}
          id={`portfolio-img-${i}`}
          focused={focusTarget === `portfolio-img-${i}`}
          title={`${String(i + 1).padStart(2, '0')} · ${img.alt}`}
          onReset={() => {
            reset(['portfolio', 'images', i])
            set(['portfolio', 'images', i, 'uploaded'], false)
            set(['portfolio', 'images', i, 'meta'], undefined)
          }}
        >
          <MediaBox
            label={img.alt || `Portfolio image ${i + 1}`}
            src={img.src}
            kind="portfolio"
            recommended="1600 × 1200 px · landscape works best"
            meta={img.meta}
            onReplace={(src, meta) => set(['portfolio', 'images', i], { ...img, src, meta, uploaded: true })}
            onReset={() => {
              reset(['portfolio', 'images', i])
              set(['portfolio', 'images', i, 'meta'], undefined)
              set(['portfolio', 'images', i, 'uploaded'], false)
            }}
          />
          <MediaSpecs src={img.src} meta={img.meta} />
          <Field label="Alt text">
            <TextInput value={img.alt} onChange={(v) => set(imgPath(i, 'alt'), v)} />
          </Field>
        </Card>
      ))}
    </div>
  )
}

/* ----------------------------- Reviews ----------------------------- */

export function ReviewsPanel({ config, set, reset }: PanelProps) {
  const r = config.reviews
  return (
    <div className="flex flex-col gap-4">
      <Card id="reviews-heading" title="Section text" onReset={() => reset(['reviews'])}>
        <Field label="Eyebrow">
          <TextInput value={r.eyebrow} onChange={(v) => set(['reviews', 'eyebrow'], v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title line 1">
            <TextInput value={r.titleLine1} onChange={(v) => set(['reviews', 'titleLine1'], v)} />
          </Field>
          <Field label="Title line 2">
            <TextInput value={r.titleLine2} onChange={(v) => set(['reviews', 'titleLine2'], v)} />
          </Field>
        </div>
        <Field label="Description">
          <TextArea value={r.description} onChange={(v) => set(['reviews', 'description'], v)} />
        </Field>
        <Field label="Rating line">
          <TextInput value={r.rating} onChange={(v) => set(['reviews', 'rating'], v)} />
        </Field>
      </Card>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/80">
          Client reviews ({r.reviews.length})
        </h4>
        <div className="flex gap-2">
          <button
            className="text-[11px] uppercase tracking-wider border border-black/10 text-muted rounded-lg px-3 py-1.5 hover:border-gold/40 transition-colors"
            onClick={() => set(['reviews', 'reviews'], [])}
            disabled={r.reviews.length === 0}
          >
            Clear all
          </button>
          <button
            className="text-[11px] uppercase tracking-wider bg-gold text-black rounded-lg px-3 py-1.5 font-semibold hover:bg-gold-light transition-colors"
            onClick={() =>
              set(['reviews', 'reviews'], [
                ...r.reviews,
                { name: 'New Client', city: 'Jamnagar', state: 'Gujarat', quote: '' },
              ])
            }
          >
            + Add
          </button>
        </div>
      </div>

      {r.reviews.map((rev: ReviewConfig, i: number) => (
        <Card key={i} title={`Review ${i + 1}`} onReset={() => reset(['reviews', 'reviews', i])}>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Name">
              <TextInput value={rev.name} onChange={(v) => set(['reviews', 'reviews', i, 'name'], v)} />
            </Field>
            <Field label="City">
              <TextInput value={rev.city} onChange={(v) => set(['reviews', 'reviews', i, 'city'], v)} />
            </Field>
            <Field label="State">
              <TextInput value={rev.state} onChange={(v) => set(['reviews', 'reviews', i, 'state'], v)} />
            </Field>
          </div>
          <Field label="Quote">
            <TextArea value={rev.quote} rows={2} onChange={(v) => set(['reviews', 'reviews', i, 'quote'], v)} />
          </Field>
          <button
            className="self-start text-[11px] uppercase tracking-wider text-muted hover:text-red-500 transition-colors"
            onClick={() =>
              set(['reviews', 'reviews'], r.reviews.filter((_: ReviewConfig, j: number) => j !== i))
            }
          >
            Remove this review
          </button>
        </Card>
      ))}
    </div>
  )
}

/* ----------------------------- Contact ----------------------------- */

export function ContactPanel({ config, set }: PanelProps) {
  const c = config.contact
  return (
    <div className="flex flex-col gap-4">
      <Card id="contact-heading" title="Heading text">
        <Field label="Eyebrow">
          <TextInput value={c.eyebrow} onChange={(v) => set(['contact', 'eyebrow'], v)} />
        </Field>
        <Field label="Title">
          <TextInput value={c.title} onChange={(v) => set(['contact', 'title'], v)} />
        </Field>
        <Field label="Directions button text">
          <TextInput value={c.directionsLabel} onChange={(v) => set(['contact', 'directionsLabel'], v)} />
        </Field>
      </Card>

      <Card title="Office info">
        <Field label="Address (one line each)">
          <TextArea
            value={c.addressLines.join('\n')}
            rows={4}
            onChange={(v) => set(['contact', 'addressLines'], v.split('\n').filter((l) => l.trim() !== ''))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone label">
            <TextInput value={c.phone.label} onChange={(v) => set(['contact', 'phone', 'label'], v)} />
          </Field>
          <Field label="Phone href">
            <TextInput value={c.phone.href} onChange={(v) => set(['contact', 'phone', 'href'], v)} />
          </Field>
          <Field label="Instagram label">
            <TextInput value={c.instagram.label} onChange={(v) => set(['contact', 'instagram', 'label'], v)} />
          </Field>
          <Field label="Instagram href">
            <TextInput value={c.instagram.href} onChange={(v) => set(['contact', 'instagram', 'href'], v)} />
          </Field>
        </div>
        {!isValidHref(c.phone.href) && (
          <p className="text-[10px] text-amber-600">Invalid phone link — use tel:+91…</p>
        )}
        {!isValidHref(c.instagram.href) && (
          <p className="text-[10px] text-amber-600">Invalid Instagram link — use https://…</p>
        )}
      </Card>

      <Card title="Google Map">
        <Field label="Embed src">
          <TextInput value={c.mapSrc} onChange={(v) => set(['contact', 'mapSrc'], v)} />
        </Field>
        <Field label="Directions link">
          <TextInput value={c.mapLink} onChange={(v) => set(['contact', 'mapLink'], v)} />
        </Field>
        {!isValidHref(c.mapSrc) && (
          <p className="text-[10px] text-amber-600">Invalid map embed src — use a https:// google.com/maps URL.</p>
        )}
        {!isValidHref(c.mapLink) && (
          <p className="text-[10px] text-amber-600">Invalid directions link — use a https:// google.com/maps URL.</p>
        )}
      </Card>
    </div>
  )
}

/* ----------------------------- Footer ----------------------------- */

export function FooterPanel({ config, set, reset }: PanelProps) {
  const f = config.footer

  return (
    <div className="flex flex-col gap-4">
      <InlineAlert tone="info">
        Phone, address and Instagram live in the <strong>Contact</strong> section — edit them there. This panel covers brand, socials, legal and credit.
      </InlineAlert>

      <Card id="footer-brand" title="Brand">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand left">
            <TextInput value={f.brandLeft} onChange={(v) => set(['footer', 'brandLeft'], v)} />
          </Field>
          <Field label="Brand right">
            <TextInput value={f.brandRight} onChange={(v) => set(['footer', 'brandRight'], v)} />
          </Field>
        </div>
      </Card>

      <Card title="Social links" onReset={() => reset(['footer', 'social'])}>
        <div className="flex flex-col gap-2">
          {f.social.map((s: FooterSocialConfig, i: number) => {
            const hrefValid = isValidHref(s.href)
            return (
              <div key={i} className="rounded-lg border border-black/10 bg-black/[0.02] p-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <SelectInput
                    value={s.type}
                    onChange={(v) => set(['footer', 'social', i, 'type'], v as FooterSocialConfig['type'])}
                    options={[
                      { value: 'instagram', label: 'Instagram' },
                      { value: 'whatsapp', label: 'WhatsApp' },
                    ]}
                  />
                  <ArrowBtn dir="up" disabled={i === 0} onClick={() => set(['footer', 'social'], moveArr(f.social, i, i - 1))} />
                  <ArrowBtn
                    dir="down"
                    disabled={i === f.social.length - 1}
                    onClick={() => set(['footer', 'social'], moveArr(f.social, i, i + 1))}
                  />
                  <button
                    aria-label="Remove social link"
                    className="w-8 h-8 shrink-0 rounded-lg border border-black/10 text-muted hover:text-red-500 hover:border-red-300 transition-colors"
                    onClick={() => set(['footer', 'social'], f.social.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <TextInput value={s.label} onChange={(v) => set(['footer', 'social', i, 'label'], v)} placeholder="Label" />
                  <TextInput value={s.href} onChange={(v) => set(['footer', 'social', i, 'href'], v)} placeholder="https://…" />
                </div>
                {!hrefValid && (
                  <p className="text-[10px] text-amber-600">Invalid URL — use https://, tel: or mailto: links.</p>
                )}
              </div>
            )
          })}
        </div>
        <button
          className="self-start text-[11px] uppercase tracking-wider text-gold-dark font-semibold hover:underline"
          onClick={() =>
            set(['footer', 'social'], [...f.social, { type: 'instagram', label: 'Instagram', href: 'https://instagram.com/' }])
          }
        >
          + Add social link
        </button>
      </Card>

      <Card title="Legal">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Copyright year">
            <TextInput value={f.copyrightYear} onChange={(v) => set(['footer', 'copyrightYear'], v)} />
          </Field>
          <Field label="Rights line">
            <TextInput value={f.rightsLine} onChange={(v) => set(['footer', 'rightsLine'], v)} />
          </Field>
        </div>
      </Card>

      <Card title="Credit">
        <Field label="Designer / developer credit">
          <TextInput value={f.designerLine} onChange={(v) => set(['footer', 'designerLine'], v)} />
        </Field>
      </Card>
    </div>
  )
}

/* ----------------------------- Films ----------------------------- */

function FilmThumb({ embedId, label }: { embedId: string; label: string }) {
  if (!embedId) {
    return (
      <div className="flex h-[64px] items-center justify-center rounded-lg border border-dashed border-black/15 bg-black/[0.03] text-[10px] text-muted">
        No video link yet
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://img.youtube.com/vi/${embedId}/hqdefault.jpg`}
      alt={label}
      className="h-[64px] w-full rounded-lg border border-black/10 object-cover"
    />
  )
}

const ASPECT_LABELS: Record<FilmAspect, string> = {
  '4/3': '4:3 · current look',
  '16/10': '16:10 · slightly wider',
  '16/9': '16:9 · cinematic widescreen',
}

export function FilmsPanel({ config, set, reset }: PanelProps) {
  const films = config.films
  const { cards, style } = films

  const cardPath = (i: number, key: keyof FilmCard) => ['films', 'cards', i, key]

  const addCard = () =>
    set(['films', 'cards'], [
      ...cards,
      { id: `f${Date.now()}`, couple: 'New Couple', description: '', embedId: '' },
    ])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] leading-relaxed text-foreground/65">
        Films page content — every card holds one YouTube wedding film. Paste any YouTube link and
        the video ID is extracted automatically. Style controls below apply to <em>all</em> cards
        so the grid stays consistent.
      </p>

      <Card id="films-style" title="Card style · all cards" onReset={() => reset(['films', 'style'])} hint="One global set — every card renders identically.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Couple name size">
            <NumberInput value={style.nameSize} min={14} max={34} onChange={(v) => set(['films', 'style', 'nameSize'], v)} suffix="px" />
          </Field>
          <Field label="Details size">
            <NumberInput value={style.descriptionSize} min={10} max={20} onChange={(v) => set(['films', 'style', 'descriptionSize'], v)} suffix="px" />
          </Field>
        </div>
        <Field label="Photo ratio">
          <SelectInput
            value={style.aspect}
            onChange={(v) => set(['films', 'style', 'aspect'], v as FilmAspect)}
            options={FILM_ASPECTS.map((a) => ({ value: a, label: ASPECT_LABELS[a] }))}
          />
        </Field>
        <Field label="Spacing between cards">
          <NumberInput value={style.gap} min={16} max={48} onChange={(v) => set(['films', 'style', 'gap'], v)} suffix="px" />
        </Field>
        <HelperNote>
          Sizes and spacing scale down fluidly on tablets and phones — the look stays balanced without extra work.
        </HelperNote>
      </Card>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/80">
          Film cards ({cards.length})
        </h4>
        <button
          className="text-[11px] uppercase tracking-wider bg-gold text-black rounded-lg px-3 py-1.5 font-semibold hover:bg-gold-light transition-colors"
          onClick={addCard}
        >
          + Add card
        </button>
      </div>

      {cards.map((card, i) => {
        const hasId = card.embedId.length > 0
        return (
          <Card key={card.id} title={`Card ${i + 1}${card.couple ? ` · ${card.couple}` : ''}`}>
            <FilmThumb embedId={card.embedId} label={card.couple || `Card ${i + 1}`} />

            <Field label={`YouTube link · card ${i + 1}`}>
              <TextInput
                value={card.embedId}
                onChange={(v) => set(cardPath(i, 'embedId'), youtubeIdFromInput(v))}
                placeholder="Paste link or 11-char video ID"
              />
            </Field>
            {!hasId && (
              <p className="text-[10px] text-amber-600">
                No video yet — paste e.g. https://youtu.be/monnnjYFFug
              </p>
            )}

            <Field label="Couple name">
              <TextInput value={card.couple} onChange={(v) => set(cardPath(i, 'couple'), v)} />
            </Field>

            <Field label="Details">
              <TextArea value={card.description} rows={2} onChange={(v) => set(cardPath(i, 'description'), v)} />
            </Field>

            <div className="flex items-center gap-1.5">
              <ArrowBtn dir="up" disabled={i === 0} onClick={() => set(['films', 'cards'], moveArr(cards, i, i - 1))} />
              <ArrowBtn
                dir="down"
                disabled={i === cards.length - 1}
                onClick={() => set(['films', 'cards'], moveArr(cards, i, i + 1))}
              />
              <button
                className="ml-auto self-start text-[11px] uppercase tracking-wider text-muted hover:text-red-500 transition-colors"
                onClick={() => set(['films', 'cards'], cards.filter((c) => c.id !== card.id))}
              >
                Remove this card
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}