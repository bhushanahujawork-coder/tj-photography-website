import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import { writeUploadAsset } from '@/lib/home-config/store'
import type { MediaMeta } from '@/lib/home-config/types'

export const runtime = 'nodejs'

const execFileP = promisify(execFile)

const ALLOWED_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const MAX_BYTES = 100 * 1024 * 1024

function extForName(name: string, mime: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.webm')) return 'webm'
  if (lower.endsWith('.mov')) return 'mov'
  if (mime === 'video/webm') return 'webm'
  if (mime === 'video/quicktime') return 'mov'
  return 'mp4'
}

async function encodeWithFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  const filter =
    "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease"
  const base = [
    '-y',
    '-i',
    inputPath,
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-crf',
    '24',
    '-preset',
    'veryfast',
    '-movflags',
    '+faststart',
  ]
  try {
    await execFileP('ffmpeg', [...base, '-c:a', 'copy', outputPath], { timeout: 300_000 })
  } catch {
    await execFileP('ffmpeg', [...base, '-c:a', 'aac', '-b:a', '128k', outputPath], {
      timeout: 300_000,
    })
  }
}

async function probeFile(filePath: string): Promise<MediaMeta> {
  const stat = await fs.stat(filePath)
  const base = { bytes: stat.size }
  try {
    const { stdout } = await execFileP(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name:format=duration', '-of', 'json', filePath],
      { timeout: 30_000 }
    )
    const parsed = JSON.parse(stdout)
    const stream = parsed?.streams?.[0]
    const width = Number(stream?.width ?? 0)
    const height = Number(stream?.height ?? 0)
    const duration = Number(parsed?.format?.duration ?? 0)
    if (width > 0 && height > 0) {
      return { ...base, width, height, format: 'mp4', duration: Math.round(duration) }
    }
  } catch {
    // fall through
  }
  return { ...base, width: 0, height: 0, format: 'mp4' }
}

export async function POST(request: NextRequest) {
  const cookieObj = request.cookies.get(ADMIN_SESSION_COOKIE)
  if (!verifySessionValue(cookieObj?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'No form data' }, { status: 400 })

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported video type (use MP4, WebM or MOV)' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Video too large (max 100MB)' }, { status: 400 })
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tj-video-'))
  const inputExt = extForName(file.name, file.type)
  const inputPath = path.join(tmpDir, `input.${inputExt}`)
  const outputPath = path.join(tmpDir, 'output.mp4')

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(inputPath, buffer)

    await encodeWithFfmpeg(inputPath, outputPath)

    const stat = await fs.stat(outputPath)
    if (!stat.isFile() || stat.size === 0) {
      throw new Error('ffmpeg produced empty output')
    }

    const videoBuffer = await fs.readFile(outputPath)
    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.mp4`
    const rel = `videos/${name}`
    const src = await writeUploadAsset(rel, videoBuffer)

    const meta = await probeFile(outputPath)

    return NextResponse.json({
      ok: true,
      src,
      bytes: stat.size,
      format: 'mp4',
      meta,
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Video optimization failed (${err instanceof Error ? err.message : 'unknown error'}); original was not touched` },
      { status: 500 }
    )
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
