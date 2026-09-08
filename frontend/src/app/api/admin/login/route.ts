import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  adminCredentialsConfigured,
  adminCredentialsMatch,
  createSessionValue,
  sessionCookieOptions,
} from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !adminCredentialsConfigured()) {
    return NextResponse.json(
      {
        error:
          'Editor access is not configured. Set EDITOR_SECRET, EDITOR_ADMIN_ID and EDITOR_ADMIN_PASS before deploying.',
      },
      { status: 503 }
    )
  }
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!adminCredentialsMatch(id, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionValue(), sessionCookieOptions())
  return response
}