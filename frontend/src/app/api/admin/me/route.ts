import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  const rawValue = cookieObj?.value
  const authenticated = verifySessionValue(rawValue)
  return NextResponse.json({ authenticated })
}

export async function POST(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  const rawValue = cookieObj?.value
  const authenticated = verifySessionValue(rawValue)
  return NextResponse.json({ authenticated })
}