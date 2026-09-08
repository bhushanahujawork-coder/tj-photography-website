export interface MediaMeta {
  width: number
  height: number
  format: string
  bytes: number
  duration?: number
}

export interface MediaRef {
  src: string
  alt: string
  uploaded?: boolean
  meta?: MediaMeta
}

export interface NavLinkCfg {
  label: string
  href: string
}

/** Width ranges the sparse overrides can target. `desktop` is not an override key — desktop values ARE the global config. */
export type WhileWidth = 'mobile' | 'tablet'

export const OVERRIDE_KEYS: readonly WhileWidth[] = ['mobile', 'tablet']

/**
 * How the CURRENT preview width classifies. Used only to resolve which config a
 * rendered value comes from (global or a sparse override) — never to select an
 * editing target by device.
 */
export type WidthClass = 'mobile' | 'tablet' | 'desktop'

/** Sparse logo exception. Every field optional + partial — only set fields deviate from the global value. */
export interface LogoOverride {
  x?: number
  y?: number
  size?: number
}

/** Sparse navigation exception. offset deviates from the global offset; spacing stays global. */
export interface NavOverride {
  offset?: number
  spacing?: number
}

export interface HeaderOverridesConfig {
  mobile?: { logo?: LogoOverride; nav?: NavOverride }
  tablet?: { logo?: LogoOverride; nav?: NavOverride }
}

export interface HeaderConfig {
  logo: {
    src: string
    alt: string
    uploaded?: boolean
    meta?: MediaMeta
    /** Global geometry — one value set for the whole site, fluidly derived at render time. */
    x: number
    y: number
    /** Logo WIDTH in px. Height stays automatic. */
    size: number
  }
  nav: {
    /** Global link list — one semantic system, max 5 enforced on merge. */
    links: NavLinkCfg[]
    offset: number
    spacing: number
  }
  /** Optional sparse per-width exceptions. Hidden from the normal editing flow. */
  overrides?: HeaderOverridesConfig
}

export interface HeroConfig {
  slides: MediaRef[]
  interval: number
}

export interface SoulCinemaTypeConfig {
  fontFamily?: string | null
  titleSize?: number | null
  titleWeight?: number | null
  titleColor?: string | null
  bodySize?: number | null
  bodyColor?: string | null
  accent?: string | null
}

export interface SoulCinemaConfig {
  eyebrow: string
  title: string
  description: string
  videoSrc: string
  poster: string
  videoUploaded?: boolean
  posterUploaded?: boolean
  frame: 'black' | 'global'
  type: SoulCinemaTypeConfig
  videoMeta?: MediaMeta
  posterMeta?: MediaMeta
}

export interface PortfolioImageConfig {
  id: string
  src: string
  alt: string
  width: number
  height: number
  overlay?: string
  uploaded?: boolean
  meta?: MediaMeta
}

export interface PortfolioConfig {
  headingTitle: string
  headingDescription: string
  images: PortfolioImageConfig[]
}

export interface ReviewConfig {
  name: string
  city: string
  state: string
  quote: string
}

export interface ReviewsConfig {
  eyebrow: string
  titleLine1: string
  titleLine2: string
  description: string
  rating: string
  reviews: ReviewConfig[]
}

export interface ContactConfig {
  eyebrow: string
  title: string
  addressLines: string[]
  phone: { label: string; href: string }
  instagram: { label: string; href: string }
  mapSrc: string
  mapLink: string
  directionsLabel: string
}

export interface FooterSocialConfig {
  type: 'instagram' | 'whatsapp'
  label: string
  href: string
}

export interface FooterConfig {
  brandLeft: string
  brandRight: string
  social: FooterSocialConfig[]
  copyrightYear: string
  rightsLine: string
  designerLine: string
}

export interface GlobalConfig {
  background: string
  noise: number
}

export interface FilmCard {
  id: string
  couple: string
  description: string
  /** 11-character YouTube video ID. Stored clean; the editor accepts full URLs and extracts it. */
  embedId: string
}

export const FILM_ASPECTS = ['4/3', '16/10', '16/9'] as const

export type FilmAspect = (typeof FILM_ASPECTS)[number]

export interface FilmsStyleConfig {
  /** Couple-name font size in px (renders fluidly on smaller screens). */
  nameSize: number
  /** Detail text font size in px (renders fluidly on smaller screens). */
  descriptionSize: number
  aspect: FilmAspect
  /** Card-to-card gap in px at desktop widths; scales down on smaller screens. */
  gap: number
}

export interface FilmsConfig {
  cards: FilmCard[]
  style: FilmsStyleConfig
}

export const SECTION_IDS = [
  'header',
  'hero',
  'soulCinema',
  'portfolio',
  'reviews',
  'contact',
  'footer',
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export interface HomeConfig {
  version: number
  global: GlobalConfig
  sectionOrder: SectionId[]
  header: HeaderConfig
  hero: HeroConfig
  soulCinema: SoulCinemaConfig
  portfolio: PortfolioConfig
  reviews: ReviewsConfig
  contact: ContactConfig
  footer: FooterConfig
  films: FilmsConfig
}

export const DEFAULT_SECTION_ORDER: SectionId[] = [...SECTION_IDS]