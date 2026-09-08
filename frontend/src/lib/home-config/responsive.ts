import type { HomeConfig, WhileWidth } from './types'
import { OVERRIDE_KEYS } from './types'

/** Intrinsic wordmark ratio (width/height). 3268×240 → height = width / 13.62. */
export const LOGO_ASPECT = 3268 / 240

/**
 * Fluid curve anchors (px of viewport width):
 * at FLUID_MIN_WIDTH the logo renders at 60% of `size`, ramping linearly (two-point
 * interpolation) up to the full `size` at FLUID_MAX_WIDTH. Below/above those anchors
 * the clamp() MIN/MAX guards hold the value flat so it never over-shrinks or grows
 * unbounded on ultra-wide screens.
 */
export const FLUID = {
  minWidth: 320,
  maxWidth: 1440,
  /** fraction of `size` rendered at the narrow anchor */
  minScale: 0.6,
} as const

const r2 = (n: number) => Math.round(n * 100) / 100
const r3 = (n: number) => Math.round(n * 1000) / 1000

/**
 * CSS clamp() that interpolates the logo WIDTH from `size * minScale` (at `minWidth`)
 * to `size` (at `maxWidth`). Expressed as `calc(<intercept>px + <slope>vw)` — one
 * smooth ramp across the whole range, no per-device media query in the happy path.
 */
export function fluidLogoWidthCss(size: number): string {
  const minV = Math.round(size * FLUID.minScale)
  const maxV = Math.round(size)
  const slope = (maxV - minV) / (FLUID.maxWidth - FLUID.minWidth) // px per px of viewport
  const intercept = minV - slope * FLUID.minWidth
  return `clamp(${minV}px, ${r2(intercept)}px + ${r3(slope * 100)}vw, ${maxV}px)`
}

/** Derived logo width in px at a concrete viewport width (for editor readouts; NOT persisted). */
export function logoWidthAt(size: number, viewportWidth: number): number {
  const minV = size * FLUID.minScale
  const maxV = size
  const slope = (maxV - minV) / (FLUID.maxWidth - FLUID.minWidth)
  const preferred = minV + slope * Math.max(0, viewportWidth - FLUID.minWidth)
  return Math.round(Math.max(minV, Math.min(maxV, preferred)))
}

const OVERRIDE_MEDIA_START: Record<WhileWidth, string> = {
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
}

function globalVars(config: HomeConfig): string {
  const { logo, nav } = config.header
  return [
    `--tj-logo-x:${logo.x}px;`,
    `--tj-logo-y:${logo.y}px;`,
    `--tj-logo-width:${fluidLogoWidthCss(logo.size)};`,
    `--tj-nav-offset:${nav.offset}px;`,
    `--tj-nav-spacing:${nav.spacing}px;`,
  ].join('')
}

function overrideVars(config: HomeConfig, bp: WhileWidth): string {
  const o = config.header.overrides?.[bp]
  const parts: string[] = []
  if (o?.logo?.x != null) parts.push(`--tj-logo-x:${o.logo.x}px;`)
  if (o?.logo?.y != null) parts.push(`--tj-logo-y:${o.logo.y}px;`)
  if (o?.logo?.size != null) parts.push(`--tj-logo-width:${o.logo.size}px;`)
  if (o?.nav?.offset != null) parts.push(`--tj-nav-offset:${o.nav.offset}px;`)
  if (o?.nav?.spacing != null) parts.push(`--tj-nav-spacing:${o.nav.spacing}px;`)
  return parts.join('')
}

/**
 * ONE responsive CSS system shared by the public homepage AND the editor preview.
 * Global values (one per setting) are emitted on `:root`; only deliberate sparse
 * overrides add media-query blocks. Fluid values come from clamp(), not extra rules.
 */
export function buildResponsiveCss(config: HomeConfig): string {
  const blocks = [`:root{${globalVars(config)}}`]
  for (const bp of OVERRIDE_KEYS) {
    const vars = overrideVars(config, bp)
    if (!vars) continue
    blocks.push(`${OVERRIDE_MEDIA_START[bp]}:root{${vars}}`)
  }
  return blocks.join('')
}