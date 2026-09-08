import { HOME_CONFIG_DEFAULTS, HOME_CONFIG_VERSION } from './defaults'
import {
  DEFAULT_SECTION_ORDER,
  OVERRIDE_KEYS,
  SECTION_IDS,
  type HeaderConfig,
  type HomeConfig,
  type SectionId,
  type WhileWidth,
  type WidthClass,
} from './types'

export const MAX_NAV_LINKS = 5

/**
 * Best-effort YouTube video ID extraction. Accepts a bare 11-char ID or any
 * common YouTube URL form (youtu.be, watch?v=, embed, shorts, live). Invalid
 * input returns '' so the editor can flag it.
 */
export function youtubeIdFromInput(input: string): string {
  const s = (input || '').trim()
  if (!s) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const m = s.match(/(?:youtu\.be\/|watch\?v=|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : ''
}

function isFilmAspect(v: unknown): v is import('./types').FilmAspect {
  return v === '4/3' || v === '16/10' || v === '16/9'
}

function isFilmCard(v: unknown): boolean {
  return isRecord(v) && isStr(v.id) && isStr(v.couple) && isStr(v.description) && isStr(v.embedId)
}

export function createInitialConfig(): HomeConfig {
  return JSON.parse(JSON.stringify(HOME_CONFIG_DEFAULTS)) as HomeConfig
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isMaybeMeta(v: unknown): boolean {
  if (!isRecord(v)) return true // tolerate stale shape
  if (v.width !== undefined && !isNum(v.width)) return false
  if (v.height !== undefined && !isNum(v.height)) return false
  if (v.bytes !== undefined && !isNum(v.bytes)) return false
  if (v.duration !== undefined && !isNum(v.duration)) return false
  return v.format === undefined || isStr(v.format)
}

export function normalizeSectionOrder(order: unknown): SectionId[] | null {
  if (!Array.isArray(order)) return null
  const ids = order.filter((x): x is string => typeof x === 'string')
  if (ids.length !== SECTION_IDS.length) return null
  const unique = new Set(ids)
  if (unique.size !== SECTION_IDS.length) return null
  if (!ids.every((id) => (SECTION_IDS as readonly string[]).includes(id))) return null
  if (ids[0] !== 'header' || ids[ids.length - 1] !== 'footer') return null
  return ids as SectionId[]
}

export function isValidSectionOrder(order: unknown): order is SectionId[] {
  return normalizeSectionOrder(order) !== null
}

export function clampNoise(n: number): number {
  return Math.max(0, Math.min(30, Math.round(n)))
}

export function isValidHref(href: unknown): boolean {
  if (!isStr(href)) return false
  const value = href.trim()
  if (value === '') return false
  if (value.startsWith('#')) return true
  // Protocol-relative network paths are rejected — an "internal" link must be a real page path.
  if (value.startsWith('//')) return false
  if (value.startsWith('/')) return true
  const lower = value.toLowerCase()
  if (lower.startsWith('mailto:')) return value.length > 'mailto:'.length
  if (lower.startsWith('tel:')) return value.length > 'tel:'.length
  if (/^https?:\/\//i.test(value)) {
    const rest = value.slice(value.indexOf('://') + 3)
    return rest.length > 0 && !rest.includes(' ')
  }
  // Any other scheme (javascript:, data:, vbscript:, file:, ftp:, custom:…) is rejected.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false
  return false
}

export interface InvalidLink {
  section: string
  field: string
  href: string
}

/**
 * Collects every editable URL/href field in a config that is non-empty and
 * fails isValidHref(). Empty values are skipped so clearing a field stays
 * possible — only malformed/dangerous links block a save.
 */
export function collectInvalidLinks(config: HomeConfig): InvalidLink[] {
  const out: InvalidLink[] = []
  const check = (section: string, field: string, href: unknown) => {
    if (!isStr(href) || href.trim() === '') return
    if (!isValidHref(href)) out.push({ section, field, href })
  }
  config.header.nav.links.forEach((l, i) => check('header.nav', `links[${i}].href`, l.href))
  check('contact.phone', 'href', config.contact.phone.href)
  check('contact.instagram', 'href', config.contact.instagram.href)
  check('contact', 'mapSrc', config.contact.mapSrc)
  check('contact', 'mapLink', config.contact.mapLink)
  config.footer.social.forEach((s, i) => check('footer.social', `[${i}].href`, s.href))
  return out
}

function isNumOrUndef(v: unknown): boolean {
  return v === undefined || isNum(v)
}

export function isHomeConfig(value: unknown): value is HomeConfig {
  if (!isRecord(value)) return false
  const v = value

  if (typeof v.version !== 'number') return false

  // global
  if (isRecord(v.global)) {
    if (!isStr(v.global.background)) return false
    if (!isNum(v.global.noise)) return false
  } else {
    return false
  }

  // sectionOrder
  if (!normalizeSectionOrder(v.sectionOrder)) return false

  // header
  const header = v.header
  if (!isRecord(header)) return false
  const logo = header.logo
  if (!isRecord(logo)) return false
  if (!isStr(logo.src) || !isStr(logo.alt)) return false
  if (!isNum(logo.x) || !isNum(logo.y) || !isNum(logo.size)) return false
  if (!isMaybeMeta(logo.meta)) return false

  const nav = header.nav
  if (!isRecord(nav)) return false
  if (!isNum(nav.offset) || !isNum(nav.spacing)) return false
  if (!Array.isArray(nav.links) || nav.links.length > MAX_NAV_LINKS) return false
  for (const link of nav.links) {
    if (!isRecord(link) || !isStr(link.label) || !isStr(link.href)) return false
  }

  if (header.overrides !== undefined) {
    if (!isRecord(header.overrides)) return false
    for (const k of OVERRIDE_KEYS) {
      const group = header.overrides[k]
      if (group === undefined) continue
      if (!isRecord(group)) return false
      if (group.logo !== undefined) {
        if (!isRecord(group.logo)) return false
        if (!isNumOrUndef(group.logo.x) || !isNumOrUndef(group.logo.y) || !isNumOrUndef(group.logo.size)) return false
      }
      if (group.nav !== undefined) {
        if (!isRecord(group.nav)) return false
        if (!isNumOrUndef(group.nav.offset) || !isNumOrUndef(group.nav.spacing)) return false
      }
    }
  }

  // hero
  const hero = v.hero
  if (!isRecord(hero) || !isNum(hero.interval)) return false
  if (!Array.isArray(hero.slides) || hero.slides.length === 0) return false
  for (const slide of hero.slides) {
    if (!isRecord(slide) || !isStr(slide.src) || !isStr(slide.alt)) return false
    if (!isMaybeMeta(slide.meta)) return false
  }

  // soulCinema
  const sc = v.soulCinema
  if (!isRecord(sc)) return false
  if (
    !isStr(sc.eyebrow) ||
    !isStr(sc.title) ||
    !isStr(sc.description) ||
    !isStr(sc.videoSrc) ||
    !isStr(sc.poster)
  ) {
    return false
  }
  if (sc.frame !== undefined && sc.frame !== 'black' && sc.frame !== 'global') return false
  if (sc.type !== undefined && !isRecord(sc.type)) return false
  if (!isMaybeMeta(sc.videoMeta) || !isMaybeMeta(sc.posterMeta)) return false

  // portfolio
  if (!isRecord(v.portfolio)) return false
  const portfolio = v.portfolio
  if (!isStr(portfolio.headingTitle) || !isStr(portfolio.headingDescription)) return false
  if (!Array.isArray(portfolio.images)) return false
  for (const img of portfolio.images) {
    if (!isRecord(img) || !isStr(img.src) || !isStr(img.alt)) return false
    if (!isNum(img.width) || !isNum(img.height)) return false
    if (img.overlay !== undefined && !isStr(img.overlay)) return false
    if (!isMaybeMeta(img.meta)) return false
  }

  // reviews
  const reviews = v.reviews
  if (!isRecord(reviews)) return false
  if (
    !isStr(reviews.eyebrow) ||
    !isStr(reviews.titleLine1) ||
    !isStr(reviews.titleLine2) ||
    !isStr(reviews.description) ||
    !isStr(reviews.rating)
  ) {
    return false
  }
  if (!Array.isArray(reviews.reviews)) return false
  for (const rev of reviews.reviews) {
    if (!isRecord(rev) || !isStr(rev.name) || !isStr(rev.city) || !isStr(rev.state) || !isStr(rev.quote)) {
      return false
    }
  }

  // contact
  const contact = v.contact
  if (!isRecord(contact)) return false
  if (
    !isStr(contact.eyebrow) ||
    !isStr(contact.title) ||
    !Array.isArray(contact.addressLines) ||
    !contact.addressLines.every(isStr)
  ) {
    return false
  }
  const phone = contact.phone
  const instagram = contact.instagram
  if (
    !isRecord(phone) ||
    !isStr(phone.label) ||
    !isStr(phone.href) ||
    !isRecord(instagram) ||
    !isStr(instagram.label) ||
    !isStr(instagram.href)
  ) {
    return false
  }
  if (!isStr(contact.mapSrc) || !isStr(contact.mapLink) || !isStr(contact.directionsLabel)) return false

  // footer
  const footer = v.footer
  if (!isRecord(footer)) return false
  if (!isStr(footer.brandLeft) || !isStr(footer.brandRight)) return false
  if (!isStr(footer.copyrightYear) || !isStr(footer.rightsLine) || !isStr(footer.designerLine)) return false
  if (!Array.isArray(footer.social)) return false
  for (const s of footer.social) {
    if (!isRecord(s)) return false
    if (s.type !== 'instagram' && s.type !== 'whatsapp') return false
    if (!isStr(s.label) || !isStr(s.href)) return false
  }

  // films — optional in stored configs so older drafts keep loading; strict when present.
  if (v.films !== undefined) {
    if (!isRecord(v.films)) return false
    if (!Array.isArray(v.films.cards) || !v.films.cards.every(isFilmCard)) return false
    const st = v.films.style
    if (!isRecord(st) || !isNum(st.nameSize) || !isNum(st.descriptionSize) || !isNum(st.gap) || !isFilmAspect(st.aspect)) {
      return false
    }
  }

  return true
}

function mergeMedia<T extends { src?: string; uploaded?: boolean; meta?: unknown } | null | undefined>(
  base: T,
  saved: unknown
): T {
  if (!isRecord(saved)) return base
  if (typeof saved.src !== 'string') return base
  return {
    ...base,
    ...saved,
    meta: isRecord(saved.meta) ? saved.meta : undefined,
  } as T
}

function mergeArray<T>(base: T[], saved: unknown): T[] {
  if (!Array.isArray(saved)) return base
  if (saved.length === 0) return base
  return saved as T[]
}

/**
 * Reaction-diffusion of film defaults and saved state. The saved card array
 * fully replaces the default one (including when empty) so removals persist;
 * style fields fall back to defaults per-field.
 */
function mergeFilms(base: HomeConfig['films'], saved: unknown): HomeConfig['films'] {
  if (!isRecord(saved)) return JSON.parse(JSON.stringify(base))
  const savedStyle = isRecord(saved.style) ? saved.style : {}
  const aspect = isFilmAspect(savedStyle.aspect) ? savedStyle.aspect : base.style.aspect
  const cards = Array.isArray(saved.cards)
    ? saved.cards.filter(isFilmCard).map((c) => ({ id: c.id, couple: c.couple, description: c.description, embedId: c.embedId }))
    : JSON.parse(JSON.stringify(base.cards))
  return {
    cards,
    style: {
      nameSize: isNum(savedStyle.nameSize) ? savedStyle.nameSize : base.style.nameSize,
      descriptionSize: isNum(savedStyle.descriptionSize) ? savedStyle.descriptionSize : base.style.descriptionSize,
      aspect,
      gap: isNum(savedStyle.gap) ? savedStyle.gap : base.style.gap,
    },
  }
}

function mergeSoulCinemaType(base: HomeConfig['soulCinema']['type'], saved: unknown): HomeConfig['soulCinema']['type'] {
  if (!isRecord(saved)) return base
  const out = { ...base }
  const keys: (keyof HomeConfig['soulCinema']['type'])[] = [
    'fontFamily',
    'titleSize',
    'titleWeight',
    'titleColor',
    'bodySize',
    'bodyColor',
    'accent',
  ]
  for (const key of keys) {
    const val = saved[key]
    if (typeof val === 'string' || typeof val === 'number' || val === null) {
      out[key] = val as never
    }
  }
  return out
}

/**
 * Legacy rendered logo WIDTH (px) per breakpoint — reconstructed from the original class-based
 * navbar (h-3 = 12px tall → 163px wide, md:h-[17px] → 231px, xl:h-5 = 20px → 272px) at the
 * intrinsic wordmark ratio 3268×240.
 */
export const LEGACY_LOGO_WIDTHS = {
  desktop: 272,
  tablet: 231,
  mobile: 163,
} as const

function numOr(v: unknown, fallback: number): number {
  return isNum(v) ? v : fallback
}

/**
 * Deterministic art-direction tolerance: a stored value that stays inside
 * max(5px, 3%) of its reference is treated as a redundant responsive copy and
 * flattened into the global value; anything beyond that becomes a sparse override.
 */
function tolerance(ref: number): number {
  return Math.max(5, Math.round(Math.abs(ref) * 0.03))
}

/**
 * Migrates legacy saved configs to the ONE-global + sparse-override shape:
 *   header.logo.{x,y,scale}          → per-breakpoint widths          (generation 1)
 *   header.logo.{desktop,tablet,mobile} → one global value + overrides  (generation 2)
 *
 * Desktop values become the single global value. Tablet/mobile values that deviate
 * beyond tolerance() from the desktop reference are preserved as sparse overrides, so
 * the existing rendered design survives the migration unchanged.
 */
export function normalizeConfig(raw: unknown): HomeConfig | null {
  if (!isRecord(raw)) return null
  const header = isRecord(raw.header) ? raw.header : null
  if (!header) return null
  const logo = isRecord(header.logo) ? header.logo : null
  const nav = isRecord(header.nav) ? header.nav : null

  const out: Record<string, unknown> = { ...raw }
  const outHeader: Record<string, unknown> = { ...header }

  // --- generation 1: pre-responsive single-geometry shape ----------------------------------
  if (logo && isNum(logo.x) && isNum(logo.y) && !isRecord(logo.desktop) && !isNum(logo.size)) {
    const scale = isNum(logo.scale) && logo.scale > 0 ? logo.scale : 1
    const mk = (w: number) => ({ x: logo.x, y: logo.y, size: Math.round(w * scale) })
    outHeader.logo = {
      src: logo.src,
      alt: logo.alt,
      uploaded: logo.uploaded,
      meta: logo.meta,
      desktop: mk(LEGACY_LOGO_WIDTHS.desktop),
      tablet: mk(LEGACY_LOGO_WIDTHS.tablet),
      mobile: mk(LEGACY_LOGO_WIDTHS.mobile),
    }
  }
  if (nav && isNum(nav.offsetX) && !isRecord(nav.desktop) && !isNum(nav.offset)) {
    outHeader.nav = {
      links: nav.links,
      desktop: { offset: nav.offsetX, spacing: isNum(nav.spacing) ? nav.spacing : 32 },
      tablet: { offset: nav.offsetX },
      mobile: { offset: nav.offsetX },
    }
  }

  // --- generation 2: per-breakpoint → one global value + sparse overrides -------------------
  const logo2 = isRecord(outHeader.logo) ? outHeader.logo : null
  const nav2 = isRecord(outHeader.nav) ? outHeader.nav : null

  if (logo2 && isRecord(logo2.desktop)) {
    const d = logo2.desktop
    const g = {
      x: numOr(d.x, 20),
      y: numOr(d.y, 0),
      size: numOr(d.size, LEGACY_LOGO_WIDTHS.desktop),
    }
    const overrides: Record<string, { logo?: Record<string, number>; nav?: Record<string, number> }> = {}

    for (const k of OVERRIDE_KEYS) {
      const b = isRecord(logo2[k]) ? logo2[k] : null
      if (!b) continue
      const o: Record<string, number> = {}
      for (const f of ['x', 'y', 'size'] as const) {
        const v = b[f]
        if (isNum(v) && Math.abs(v - g[f]) > tolerance(g[f])) o[f] = v
      }
      if (Object.keys(o).length > 0) overrides[k] = { logo: o }
    }

    outHeader.logo = {
      src: isStr(logo2.src) ? logo2.src : '/logo/tj-logo-white.png',
      alt: isStr(logo2.alt) ? logo2.alt : 'TJ Photography',
      uploaded: logo2.uploaded,
      meta: logo2.meta,
      ...g,
    }

    if (nav2 && isRecord(nav2.desktop)) {
      const nd = nav2.desktop
      outHeader.nav = {
        links: nav2.links,
        offset: numOr(nd.offset, -14),
        spacing: numOr(nd.spacing, 32),
      }
      for (const k of OVERRIDE_KEYS) {
        const b = isRecord(nav2[k]) ? nav2[k] : null
        if (!b) continue
        const o: Record<string, number> = {}
        if (isNum(b.offset) && Math.abs(b.offset - numOr(nd.offset, -14)) > tolerance(numOr(nd.offset, -14))) {
          o.offset = b.offset
        }
        if (isNum(b.spacing) && Math.abs(b.spacing - numOr(nd.spacing, 32)) > tolerance(numOr(nd.spacing, 32))) {
          o.spacing = b.spacing
        }
        if (Object.keys(o).length > 0) {
          overrides[k] = { ...(overrides[k] ?? {}), nav: o }
        }
      }
    }

    if (Object.keys(overrides).length > 0) outHeader.overrides = overrides
  }

  out.header = outHeader
  if (!isHomeConfig(out)) return null
  return out as unknown as HomeConfig
}

/* ------------------------- header-level immutable helpers ------------------------- */

function cloneOverrides(header: HeaderConfig): NonNullable<HeaderConfig['overrides']> {
  return JSON.parse(JSON.stringify(header.overrides ?? {}))
}

/** Set one sparse logo override field for a width range. */
export function withLogoOverride(header: HeaderConfig, k: WhileWidth, field: 'x' | 'y' | 'size', value: number): HeaderConfig {
  const overrides = cloneOverrides(header)
  overrides[k] = { ...(overrides[k] ?? {}), logo: { ...(overrides[k]?.logo ?? {}), [field]: value } }
  return { ...header, overrides }
}

/** Set one sparse nav override field for a width range. */
export function withNavOverride(header: HeaderConfig, k: WhileWidth, field: 'offset' | 'spacing', value: number): HeaderConfig {
  const overrides = cloneOverrides(header)
  overrides[k] = { ...(overrides[k] ?? {}), nav: { ...(overrides[k]?.nav ?? {}), [field]: value } }
  return { ...header, overrides }
}

function pruneOverrides(header: HeaderConfig): HeaderConfig {
  const overrides = cloneOverrides(header)
  for (const k of OVERRIDE_KEYS) {
    const g = overrides[k]
    if (!g) continue
    if ((g.logo && Object.keys(g.logo).length === 0) || !g.logo) delete g.logo
    if ((g.nav && Object.keys(g.nav).length === 0) || !g.nav) delete g.nav
    if (Object.keys(g).length === 0) delete overrides[k]
  }
  if (Object.keys(overrides).length === 0) {
    const rest = { ...header }
    delete rest.overrides
    return rest
  }
  return { ...header, overrides }
}

/** Clear a logo override field (or the whole group when no field) for a width range. */
export function clearLogoOverride(header: HeaderConfig, k: WhileWidth, field?: 'x' | 'y' | 'size'): HeaderConfig {
  const overrides = cloneOverrides(header)
  const g = overrides[k]
  if (!g?.logo) return header
  if (field) {
    const next = { ...g.logo }
    delete next[field]
    if (Object.keys(next).length > 0) g.logo = next
    else delete g.logo
  } else {
    delete g.logo
  }
  return pruneOverrides(header)
}

/** Clear the full nav override group for a width range. */
export function clearNavOverride(header: HeaderConfig, k: WhileWidth): HeaderConfig {
  const overrides = cloneOverrides(header)
  const g = overrides[k]
  if (!g?.nav) return header
  delete g.nav
  return pruneOverrides(header)
}

/* ---------------------- width-aware WYSIWYG accessors (editor) ---------------------- */

export function widthClassOf(width: number): WidthClass {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export type LogoField = 'x' | 'y' | 'size'

/**
 * Value currently RENDERED at `width`: the sparse override when one pins that field at
 * the current width range, otherwise the global value. Never a derived clamp() number —
 * size readouts show the persisted intent, with the fluid read-out shown alongside.
 */
export function readLogoValue(config: HomeConfig, width: number, field: LogoField): number {
  const k = widthClassOf(width)
  const ov = k === 'desktop' ? undefined : config.header.overrides?.[k]?.logo?.[field]
  return typeof ov === 'number' ? ov : config.header.logo[field]
}

/** WYSIWYG commit: writes the pinned override when one exists for this field at `width`, else the global value. */
export function setLogoValue(config: HomeConfig, width: number, field: LogoField, value: number): HomeConfig {
  const header = config.header
  const k = widthClassOf(width)
  if (k !== 'desktop' && header.overrides?.[k]?.logo?.[field] != null) {
    return { ...config, header: withLogoOverride(header, k, field, value) }
  }
  return { ...config, header: { ...header, logo: { ...header.logo, [field]: value } } }
}

export function readNavOffset(config: HomeConfig, width: number): number {
  const k = widthClassOf(width)
  const ov = k === 'desktop' ? undefined : config.header.overrides?.[k]?.nav?.offset
  return typeof ov === 'number' ? ov : config.header.nav.offset
}

export function setNavOffset(config: HomeConfig, width: number, value: number): HomeConfig {
  const header = config.header
  const k = widthClassOf(width)
  if (k !== 'desktop' && header.overrides?.[k]?.nav?.offset != null) {
    return { ...config, header: withNavOverride(header, k, 'offset', value) }
  }
  return { ...config, header: { ...header, nav: { ...header.nav, offset: value } } }
}

/* ------------------------------ merge ---------------------------------------------- */

function mergeHeaderOverrides(base: HeaderConfig['overrides'], saved: unknown): HeaderConfig['overrides'] {
  if (!isRecord(saved)) return base ? JSON.parse(JSON.stringify(base)) : undefined
  const out = base ? JSON.parse(JSON.stringify(base)) : {}
  for (const k of OVERRIDE_KEYS) {
    const group = isRecord(saved[k]) ? saved[k] : null
    if (!group) continue
    const target = isRecord(out[k]) ? out[k] : {}
    const sl = isRecord(group.logo) ? group.logo : null
    if (sl) {
      const lg = isRecord(target.logo) ? target.logo : {}
      for (const f of ['x', 'y', 'size'] as const) {
        const v = sl[f]
        if (isNum(v)) lg[f] = v
      }
      if (Object.keys(lg).length > 0) target.logo = lg
    }
    const sn = isRecord(group.nav) ? group.nav : null
    if (sn) {
      const ng = isRecord(target.nav) ? target.nav : {}
      for (const f of ['offset', 'spacing'] as const) {
        const v = sn[f]
        if (isNum(v)) ng[f] = v
      }
      if (Object.keys(ng).length > 0) target.nav = ng
    }
    if (Object.keys(target).length > 0) out[k] = target
    else delete out[k]
  }
  if (Object.keys(out).length === 0) return undefined
  return out
}

export function mergeConfig(base: HomeConfig, saved: unknown): HomeConfig {
  const s = normalizeConfig(saved)
  if (!s) return base

  const order = normalizeSectionOrder(s.sectionOrder)
  const global = {
    background: isStr(s.global.background) ? s.global.background : base.global.background,
    noise: isNum(s.global.noise) ? clampNoise(s.global.noise) : base.global.noise,
  }

  return {
    ...base,
    version: typeof s.version === 'number' ? s.version : base.version,
    global,
    sectionOrder: order ?? base.sectionOrder,
    header: {
      logo: {
        src: isStr(s.header.logo.src) ? s.header.logo.src : base.header.logo.src,
        alt: isStr(s.header.logo.alt) ? s.header.logo.alt : base.header.logo.alt,
        uploaded: !!s.header.logo.uploaded || base.header.logo.uploaded,
        meta: isRecord(s.header.logo.meta) ? s.header.logo.meta : base.header.logo.meta,
        x: isNum(s.header.logo.x) ? s.header.logo.x : base.header.logo.x,
        y: isNum(s.header.logo.y) ? s.header.logo.y : base.header.logo.y,
        size: isNum(s.header.logo.size) ? s.header.logo.size : base.header.logo.size,
      },
      nav: {
        offset: isNum(s.header.nav.offset) ? s.header.nav.offset : base.header.nav.offset,
        spacing: isNum(s.header.nav.spacing) ? s.header.nav.spacing : base.header.nav.spacing,
        links: mergeArray(base.header.nav.links, s.header.nav.links).slice(0, MAX_NAV_LINKS),
      },
      overrides: mergeHeaderOverrides(base.header.overrides, s.header.overrides),
    },
    hero: {
      interval: isNum(s.hero.interval) ? s.hero.interval : base.hero.interval,
      slides: mergeArray(base.hero.slides, s.hero.slides).map(
        (sl) => mergeMedia(sl, sl) as HomeConfig['hero']['slides'][number]
      ),
    },
    soulCinema: {
      eyebrow: isStr(s.soulCinema.eyebrow) ? s.soulCinema.eyebrow : base.soulCinema.eyebrow,
      title: isStr(s.soulCinema.title) ? s.soulCinema.title : base.soulCinema.title,
      description: isStr(s.soulCinema.description) ? s.soulCinema.description : base.soulCinema.description,
      videoSrc: isStr(s.soulCinema.videoSrc) ? s.soulCinema.videoSrc : base.soulCinema.videoSrc,
      poster: isStr(s.soulCinema.poster) ? s.soulCinema.poster : base.soulCinema.poster,
      videoUploaded: !!s.soulCinema.videoUploaded || base.soulCinema.videoUploaded,
      posterUploaded: !!s.soulCinema.posterUploaded || base.soulCinema.posterUploaded,
      frame: s.soulCinema.frame === 'black' || s.soulCinema.frame === 'global'
        ? s.soulCinema.frame
        : base.soulCinema.frame,
      type: mergeSoulCinemaType(base.soulCinema.type, s.soulCinema.type),
      videoMeta: isRecord(s.soulCinema.videoMeta) ? s.soulCinema.videoMeta : base.soulCinema.videoMeta,
      posterMeta: isRecord(s.soulCinema.posterMeta) ? s.soulCinema.posterMeta : base.soulCinema.posterMeta,
    },
    portfolio: {
      headingTitle: isStr(s.portfolio.headingTitle) ? s.portfolio.headingTitle : base.portfolio.headingTitle,
      headingDescription: isStr(s.portfolio.headingDescription)
        ? s.portfolio.headingDescription
        : base.portfolio.headingDescription,
      images: mergeArray(base.portfolio.images, s.portfolio.images).map(
        (img) => mergeMedia(img, img) as HomeConfig['portfolio']['images'][number]
      ),
    },
    reviews: {
      eyebrow: isStr(s.reviews.eyebrow) ? s.reviews.eyebrow : base.reviews.eyebrow,
      titleLine1: isStr(s.reviews.titleLine1) ? s.reviews.titleLine1 : base.reviews.titleLine1,
      titleLine2: isStr(s.reviews.titleLine2) ? s.reviews.titleLine2 : base.reviews.titleLine2,
      description: isStr(s.reviews.description) ? s.reviews.description : base.reviews.description,
      rating: isStr(s.reviews.rating) ? s.reviews.rating : base.reviews.rating,
      reviews: mergeArray(base.reviews.reviews, s.reviews.reviews),
    },
    contact: {
      eyebrow: isStr(s.contact.eyebrow) ? s.contact.eyebrow : base.contact.eyebrow,
      title: isStr(s.contact.title) ? s.contact.title : base.contact.title,
      addressLines: mergeArray(base.contact.addressLines, s.contact.addressLines),
      phone: {
        label: isStr(s.contact.phone?.label) ? s.contact.phone.label : base.contact.phone.label,
        href: isStr(s.contact.phone?.href) ? s.contact.phone.href : base.contact.phone.href,
      },
      instagram: {
        label: isStr(s.contact.instagram?.label) ? s.contact.instagram.label : base.contact.instagram.label,
        href: isStr(s.contact.instagram?.href) ? s.contact.instagram.href : base.contact.instagram.href,
      },
      mapSrc: isStr(s.contact.mapSrc) ? s.contact.mapSrc : base.contact.mapSrc,
      mapLink: isStr(s.contact.mapLink) ? s.contact.mapLink : base.contact.mapLink,
      directionsLabel: isStr(s.contact.directionsLabel) ? s.contact.directionsLabel : base.contact.directionsLabel,
    },
    footer: {
      brandLeft: isStr(s.footer.brandLeft) ? s.footer.brandLeft : base.footer.brandLeft,
      brandRight: isStr(s.footer.brandRight) ? s.footer.brandRight : base.footer.brandRight,
      social: mergeArray(base.footer.social, s.footer.social),
      copyrightYear: isStr(s.footer.copyrightYear) ? s.footer.copyrightYear : base.footer.copyrightYear,
      rightsLine: isStr(s.footer.rightsLine) ? s.footer.rightsLine : base.footer.rightsLine,
      designerLine: isStr(s.footer.designerLine) ? s.footer.designerLine : base.footer.designerLine,
    },
    films: mergeFilms(base.films, s.films),
  }
}

export function getDefaultSectionOrder(): SectionId[] {
  return [...DEFAULT_SECTION_ORDER]
}

export { HOME_CONFIG_VERSION }