import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import { readConfig, type ConfigStatus } from '@/lib/home-config/store'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status')
  const safe: ConfigStatus = status === 'draft' ? 'draft' : 'published'

  if (safe === 'draft') {
    const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
    if (!verifySessionValue(cookieObj?.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const config = await readConfig(safe)
  return NextResponse.json(config)
}