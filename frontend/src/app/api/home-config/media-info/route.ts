import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import { readUploadAsset } from '@/lib/home-config/store'
import type { MediaMeta } from '@/lib/home-config/types'

export const runtime = 'nodejs'

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v'])

function isVideoPath(src: string): boolean {
  const ext = src.slice(src.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXT.has(ext)
}

export async function GET(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  if (!verifySessionValue(cookieObj?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const src = request.nextUrl.searchParams.get('src')
  if (!src) {
    return NextResponse.json({ error: 'Invalid src' }, { status: 400 })
  }

  const buffer = await readUploadAsset(src)
  if (!buffer) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  if (isVideoPath(src)) {
    // For videos, we can't probe from a buffer without a file.
    // Return basic info; video meta is set at upload time.
    return NextResponse.json({
      meta: {
        width: 0,
        height: 0,
        format: 'mp4',
        bytes: buffer.length,
      } satisfies MediaMeta,
    })
  }

  try {
    const info = await sharp(buffer).metadata()
    const meta: MediaMeta = {
      width: info.width ?? 0,
      height: info.height ?? 0,
      format: (info.format ?? 'unknown') as string,
      bytes: buffer.length,
    }
    return NextResponse.json({ meta })
  } catch (err) {
    return NextResponse.json(
      { error: `Probe failed (${err instanceof Error ? err.message : 'unknown error'})` },
      { status: 500 }
    )
  }
}
