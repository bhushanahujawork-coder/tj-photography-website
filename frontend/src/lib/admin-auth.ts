import { createHmac, timingSafeEqual } from 'crypto'

export const ADMIN_SESSION_COOKIE = 'tj_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12

// Editor credentials. Uses env vars when provided, otherwise falls back to the
// same default credentials so the editor works identically in local and Vercel.
const DEV_SECRET = 'tj-editor-dev-secret-change-me'
const DEV_ID = 'tjphotography'
const DEV_PASS = 'admin123'

const isProduction = process.env.NODE_ENV === 'production'

const SECRET = process.env.EDITOR_SECRET || DEV_SECRET
const ADMIN_ID = process.env.EDITOR_ADMIN_ID || DEV_ID
const ADMIN_PASS = process.env.EDITOR_ADMIN_PASS || DEV_PASS

/**
 * True when the editor credentials are fully provisioned. Falls back to the
 * shared defaults when no env vars are set, so login works on both local and
 * Vercel without extra configuration.
 */
export function adminCredentialsConfigured(): boolean {
  return Boolean(SECRET && ADMIN_ID && ADMIN_PASS)
}

function base64url(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64url')
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createSessionValue(): string {
  const payload = base64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }))
  return `${payload}.${sign(payload)}`
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false
  if (isProduction && !adminCredentialsConfigured()) return false
  const parts = value.split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    return typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

export function adminCredentialsMatch(id: string, pass: string): boolean {
  return id === ADMIN_ID && pass === ADMIN_PASS
}

export function sessionCookieOptions(): {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  }
}