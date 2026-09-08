import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import { createInitialConfig } from '@/lib/home-config/shared'
import { wipeUploads, writeConfig } from '@/lib/home-config/store'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  if (!verifySessionValue(cookieObj?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const defaults = createInitialConfig()
  await writeConfig('draft', defaults)
  await writeConfig('published', defaults)
  await wipeUploads()
  return NextResponse.json({ ok: true })
}