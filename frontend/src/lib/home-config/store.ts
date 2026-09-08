import { promises as fs } from 'fs'
import path from 'path'
import { createInitialConfig, mergeConfig } from './shared'
import type { HomeConfig } from './types'

export type ConfigStatus = 'draft' | 'published'

/* ------------------------------------------------------------------ */
/*  Dual-mode storage layer                                           */
/*  • Vercel:  Blob (uploads) + KV (config)                           */
/*  • Local:   node:fs (current behaviour, zero-change dev experience) */
/* ------------------------------------------------------------------ */

const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN
const isKV = !!process.env.KV_REST_API_URL

const KV_DRAFT = 'home-config:draft'
const KV_PUBLISHED = 'home-config:published'
const BLOB_PREFIX = 'uploads/'

/* ------------------------------------------------------------------ */
/*  Local (fs) helpers — unchanged from original                      */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), 'data', 'home-config')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

function fileFor(status: ConfigStatus): string {
  return path.join(DATA_DIR, `${status}.json`)
}

export function toDiskPath(src: string): string | null {
  if (!src.startsWith('/')) return null
  const rel = src.replace(/^\/+/, '')
  const resolved = path.resolve(PUBLIC_DIR, rel)
  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) return null
  return resolved
}

/* ------------------------------------------------------------------ */
/*  Config read/write (KV when available, else fs)                    */
/* ------------------------------------------------------------------ */

export async function readConfig(status: ConfigStatus): Promise<HomeConfig> {
  if (isKV) {
    const { kv } = await import('@vercel/kv')
    const key = status === 'draft' ? KV_DRAFT : KV_PUBLISHED
    const raw = await kv.get<HomeConfig>(key)
    if (!raw) return createInitialConfig()
    return mergeConfig(createInitialConfig(), raw)
  }

  try {
    const raw = await fs.readFile(fileFor(status), 'utf-8')
    return mergeConfig(createInitialConfig(), JSON.parse(raw))
  } catch {
    return createInitialConfig()
  }
}

export async function writeConfig(status: ConfigStatus, config: HomeConfig): Promise<void> {
  const clean = JSON.parse(JSON.stringify(config))

  if (isKV) {
    const { kv } = await import('@vercel/kv')
    const key = status === 'draft' ? KV_DRAFT : KV_PUBLISHED
    await kv.set(key, clean)
    return
  }

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(fileFor(status), JSON.stringify(clean, null, 2), 'utf-8')
}

/* ------------------------------------------------------------------ */
/*  Upload asset helpers (Blob when available, else fs)               */
/* ------------------------------------------------------------------ */

/**
 * Write an upload asset. Returns the public path/URL to use in config.
 * On Vercel: uploads to Blob, returns full URL.
 * Locally:   writes to public/, returns relative path.
 */
export async function writeUploadAsset(rel: string, buffer: Buffer): Promise<string> {
  if (isVercel) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`${BLOB_PREFIX}${rel}`, buffer, {
      access: 'public',
      contentType: guessMime(rel),
    })
    return blob.url
  }

  await ensureUploadsDirs()
  const fullRel = `${BLOB_PREFIX}${rel}` // 'uploads/images/...'
  await fs.writeFile(publicFilePath(fullRel), buffer)
  return `/${fullRel}`
}

/**
 * Read an upload asset as a Buffer. Returns null when not found.
 */
export async function readUploadAsset(src: string): Promise<Buffer | null> {
  if (isVercel && isBlobUrl(src)) {
    try {
      const resp = await fetch(src)
      if (!resp.ok) return null
      const ab = await resp.arrayBuffer()
      return Buffer.from(ab)
    } catch {
      return null
    }
  }

  const disk = toDiskPath(src)
  if (!disk) return null
  try {
    return await fs.readFile(disk)
  } catch {
    return null
  }
}

export async function assetExists(src: string): Promise<boolean> {
  if (!src) return true

  if (isVercel && isBlobUrl(src)) {
    try {
      const { head } = await import('@vercel/blob')
      await head(src)
      return true
    } catch {
      return false
    }
  }

  const diskPath = toDiskPath(src)
  if (!diskPath) return false
  try {
    await fs.access(diskPath)
    return true
  } catch {
    return false
  }
}

export function isUploadedPath(src: string): boolean {
  if (isVercel) return isBlobUrl(src)
  return src.startsWith('/uploads/')
}

export function isBlobUrl(src: string): boolean {
  return src.startsWith('https://') && src.includes('.vercel-storage.com')
}

/* ------------------------------------------------------------------ */
/*  Collect & clean unreferenced uploads                              */
/* ------------------------------------------------------------------ */

export function collectReferencedUploads(config: HomeConfig): Set<string> {
  const refs = new Set<string>()
  const tryAdd = (src?: string | null) => {
    if (src && isUploadedPath(src)) refs.add(src)
  }
  const { header, hero, soulCinema, portfolio } = config
  tryAdd(header.logo.src)
  hero.slides.forEach((s) => tryAdd(s.src))
  tryAdd(soulCinema.videoSrc)
  tryAdd(soulCinema.poster)
  portfolio.images.forEach((img) => tryAdd(img.src))
  return refs
}

function referencedUploadsToDisk(other: Set<string>): Set<string> {
  const disk = new Set<string>()
  other.forEach((src) => {
    const p = toDiskPath(src)
    if (p) disk.add(p)
  })
  return disk
}

export async function deleteUnreferencedUploads(keep: Set<string>): Promise<string[]> {
  if (isVercel) {
    return deleteUnreferencedBlobUploads(keep)
  }

  // Local fs cleanup
  const uploadsDir = path.join(PUBLIC_DIR, 'uploads')
  let entries: string[] = []
  try {
    entries = await fs.readdir(uploadsDir)
  } catch {
    return []
  }
  const keepDisk = referencedUploadsToDisk(keep)
  const deleted: string[] = []
  const deletePath = async (dir: string, name: string, relPath: string) => {
    const full = path.join(dir, name)
    const stat = await fs.stat(full).catch(() => null)
    if (!stat) return
    if (stat.isDirectory()) return
    if (keepDisk.has(path.resolve(full))) return
    await fs.unlink(full).catch(() => {})
    deleted.push(relPath)
  }
  for (const name of entries) {
    await deletePath(uploadsDir, name, `/uploads/${name}`)
  }
  const nestedDirs = ['images', 'videos']
  for (const sub of nestedDirs) {
    const subDir = path.join(uploadsDir, sub)
    let files: string[] = []
    try {
      files = await fs.readdir(subDir)
    } catch {
      continue
    }
    for (const name of files) {
      await deletePath(subDir, name, `/uploads/${sub}/${name}`)
    }
  }
  return deleted
}

async function deleteUnreferencedBlobUploads(keep: Set<string>): Promise<string[]> {
  const { list, del } = await import('@vercel/blob')
  const deleted: string[] = []
  let cursor: string | undefined

  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 })
    for (const blob of page.blobs) {
      if (!keep.has(blob.url)) {
        deleted.push(blob.url)
      }
    }
    cursor = page.cursor
  } while (cursor)

  if (deleted.length > 0) {
    await del(deleted)
  }
  return deleted
}

export async function wipeUploads(): Promise<void> {
  if (isVercel) {
    const { list, del } = await import('@vercel/blob')
    const urls: string[] = []
    let cursor: string | undefined
    do {
      const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 })
      for (const blob of page.blobs) urls.push(blob.url)
      cursor = page.cursor
    } while (cursor)
    if (urls.length > 0) await del(urls)
    return
  }

  const uploadsDir = path.join(PUBLIC_DIR, 'uploads')
  try {
    await fs.rm(uploadsDir, { recursive: true, force: true })
  } catch {
    // noop
  }
}

export async function ensureUploadsDirs(): Promise<void> {
  if (isVercel) return // Blob handles dirs implicitly
  const images = path.join(PUBLIC_DIR, 'uploads', 'images')
  const videos = path.join(PUBLIC_DIR, 'uploads', 'videos')
  await fs.mkdir(images, { recursive: true })
  await fs.mkdir(videos, { recursive: true })
}

export function publicFilePath(rel: string): string {
  return path.join(PUBLIC_DIR, rel.replace(/^\/+/, ''))
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function guessMime(rel: string): string {
  const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase()
  const map: Record<string, string> = {
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    avif: 'image/avif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  }
  return map[ext] ?? 'application/octet-stream'
}

/**
 * Returns a human-readable description of the current storage mode.
 */
export function storageMode(): string {
  if (isVercel && isKV) return 'Vercel Blob + KV'
  if (isVercel) return 'Vercel Blob (config on fs)'
  if (isKV) return 'KV (uploads on fs)'
  return 'Local filesystem'
}
