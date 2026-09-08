// Migrate home-config draft + published from the legacy per-breakpoint shape
// (header.logo.desktop/tablet/mobile, header.nav.desktop/tablet/mobile) to the
// ONE-global + sparse-override shape. Mirrors src/lib/home-config/shared.ts
// normalizeConfig exactly, so the migrated files match what the runtime expects.
//
// Backups:  data/home-config/draft.backup-YYYYMMDD-HHmmss.json  (same for published)
// Run:      node scripts/migrate-home-config.mjs   (from ./frontend)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', 'data', 'home-config')
const FILES = ['draft.json', 'published.json']

const OVERRIDE_KEYS = ['mobile', 'tablet']
const LEGACY_LOGO_WIDTHS = { desktop: 272, tablet: 231, mobile: 163 }

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const isRecord = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

function numOr(v, fallback) {
  return isNum(v) ? v : fallback
}

/** Tolerance used to decide if a per-breakpoint value is a deliberate art-direction override. */
function tolerance(ref) {
  return Math.max(5, Math.round(Math.abs(ref) * 0.03))
}

function migrateHeader(header) {
  if (!isRecord(header)) return header

  let logo = header.logo
  let nav = header.nav

  // ---- generation 1: legacy single-geometry (logo.x/y/scale) ----
  if (isRecord(logo) && isNum(logo.x) && isNum(logo.y) && !isRecord(logo.desktop) && !isNum(logo.size)) {
    const scale = isNum(logo.scale) && logo.scale > 0 ? logo.scale : 1
    const mk = (w) => ({ x: logo.x, y: logo.y, size: Math.round(w * scale) })
    const rest = { ...logo }
    delete rest.x
    delete rest.y
    delete rest.scale
    logo = { ...rest, desktop: mk(LEGACY_LOGO_WIDTHS.desktop), tablet: mk(LEGACY_LOGO_WIDTHS.tablet), mobile: mk(LEGACY_LOGO_WIDTHS.mobile) }
  }
  if (isRecord(nav) && isNum(nav.offsetX) && !isRecord(nav.desktop) && !isNum(nav.offset)) {
    const rest = { ...nav }
    delete rest.offsetX
    nav = {
      ...rest,
      desktop: { offset: nav.offsetX, spacing: numOr(nav.spacing, 32) },
      tablet: { offset: nav.offsetX },
      mobile: { offset: nav.offsetX },
    }
  }

  // ---- generation 2: per-breakpoint → one global value + sparse overrides ----
  const lig = isRecord(logo) && isRecord(logo.desktop) ? logo : null
  const nvg = isRecord(nav) && isRecord(nav.desktop) ? nav : null
  if (!lig || !nvg) {
    throw new Error(`Unexpected header shape — expected header.logo.desktop and header.nav.desktop.`)
  }

  const g = {
    x: numOr(lig.desktop.x, 20),
    y: numOr(lig.desktop.y, 0),
    size: numOr(lig.desktop.size, LEGACY_LOGO_WIDTHS.desktop),
  }
  const gNav = {
    offset: numOr(nvg.desktop.offset, -14),
    spacing: numOr(nvg.desktop.spacing, 32),
  }

  const overrides = {}
  for (const k of OVERRIDE_KEYS) {
    const b = lig[k]
    if (!isRecord(b)) continue
    const o = {}
    for (const f of ['x', 'y', 'size']) {
      const v = b[f]
      if (isNum(v) && Math.abs(v - g[f]) > tolerance(g[f])) o[f] = v
    }
    if (Object.keys(o).length > 0) overrides[k] = { logo: o }
  }
  for (const k of OVERRIDE_KEYS) {
    const b = nvg[k]
    if (!isRecord(b)) continue
    const o = {}
    if (isNum(b.offset) && Math.abs(b.offset - gNav.offset) > tolerance(gNav.offset)) o.offset = b.offset
    if (isNum(b.spacing) && Math.abs(b.spacing - gNav.spacing) > tolerance(gNav.spacing)) o.spacing = b.spacing
    if (Object.keys(o).length > 0) overrides[k] = { ...(overrides[k] ?? {}), nav: o }
  }

  const logoRest = { ...lig }
  delete logoRest.desktop
  delete logoRest.tablet
  delete logoRest.mobile
  const navRest = { ...nvg }
  delete navRest.desktop
  delete navRest.tablet
  delete navRest.mobile

  const out = {
    ...header,
    logo: { ...logoRest, x: g.x, y: g.y, size: g.size },
    nav: { ...navRest, offset: gNav.offset, spacing: gNav.spacing },
  }
  if (Object.keys(overrides).length > 0) out.overrides = overrides
  return out
}

function migrate(config) {
  if (!isRecord(config) || !isRecord(config.header)) {
    throw new Error(`File does not look like a home-config (missing header).`)
  }
  return { ...config, header: migrateHeader(config.header) }
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Data directory not found: ${DATA_DIR}`)
  process.exit(1)
}

const stamp = timestamp()
for (const file of FILES) {
  const full = path.join(DATA_DIR, file)
  if (!fs.existsSync(full)) {
    console.warn(`  skip (missing): ${file}`)
    continue
  }
  const raw = fs.readFileSync(full, 'utf8')
  let config
  try {
    config = JSON.parse(raw)
  } catch {
    console.error(`  skip (invalid JSON): ${file}`)
    continue
  }

  const backup = path.join(DATA_DIR, file.replace('.json', `.backup-${stamp}.json`))
  fs.writeFileSync(backup, raw + '\n')
  console.log(`  backup: ${path.relative(process.cwd(), backup)}`)

  const migrated = migrate(config)
  fs.writeFileSync(full, JSON.stringify(migrated, null, 2) + '\n')
  console.log(`  migrated: ${file}`)
  console.log(`    header.logo  → x ${migrated.header.logo.x}, y ${migrated.header.logo.y}, size ${migrated.header.logo.size}`)
  console.log(`    header.nav   → offset ${migrated.header.nav.offset}, spacing ${migrated.header.nav.spacing}`)
  if (migrated.header.overrides) {
    for (const [k, grp] of Object.entries(migrated.header.overrides)) {
      console.log(`    override.${k} → ${JSON.stringify(grp)}`)
    }
  } else {
    console.log(`    overrides    → none`)
  }
}
console.log('Done.')