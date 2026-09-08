import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import {
  collectInvalidLinks,
  createInitialConfig,
  mergeConfig,
  normalizeConfig,
} from '@/lib/home-config/shared'
import { writeConfig } from '@/lib/home-config/store'

export const runtime = 'nodejs'

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
  const config = mergeConfig(createInitialConfig(), normalized)
  const invalid = collectInvalidLinks(config)
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: 'Invalid link(s) — fix them in the editor before saving', invalid },
      { status: 400 }
    )
  }
  await writeConfig('draft', config)
  return NextResponse.json({ ok: true })
}