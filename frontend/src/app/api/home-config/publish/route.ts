import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import {
  collectInvalidLinks,
  createInitialConfig,
  mergeConfig,
  normalizeConfig,
} from '@/lib/home-config/shared'
import {
  assetExists,
  collectReferencedUploads,
  deleteUnreferencedUploads,
  readConfig,
  writeConfig,
} from '@/lib/home-config/store'
import type { HomeConfig } from '@/lib/home-config/types'

export const runtime = 'nodejs'

function allReferencedMedia(config: HomeConfig): string[] {
  const refs: string[] = []
  const push = (src?: string | null) => {
    if (src) refs.push(src)
  }
  push(config.header.logo.src)
  config.hero.slides.forEach((s) => push(s.src))
  push(config.soulCinema.videoSrc)
  push(config.soulCinema.poster)
  config.portfolio.images.forEach((img) => push(img.src))
  return refs
}

export async function POST(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  if (!verifySessionValue(cookieObj?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const normalized = normalizeConfig(body)
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
  }

  const nextConfig = mergeConfig(createInitialConfig(), normalized)

  const invalid = collectInvalidLinks(nextConfig)
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: 'Invalid link(s) — fix them in the editor before publishing', invalid },
      { status: 400 }
    )
  }

  const missing: string[] = []
  for (const src of allReferencedMedia(nextConfig)) {
    if (!(await assetExists(src))) missing.push(src)
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Referenced media missing on server', missing },
      { status: 400 }
    )
  }

  const previousPublished = await readConfig('published')

  await writeConfig('draft', nextConfig)
  await writeConfig('published', nextConfig)

  const keep = collectReferencedUploads(nextConfig)
  const deleted = await deleteUnreferencedUploads(keep)

  return NextResponse.json({ ok: true, deleted, previousPublishedRefs: allReferencedMedia(previousPublished).length })
}