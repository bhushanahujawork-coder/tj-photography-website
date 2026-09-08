import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomBytes } from 'node:crypto'
import { ADMIN_SESSION_COOKIE, verifySessionValue } from '@/lib/admin-auth'
import { writeUploadAsset } from '@/lib/home-config/store'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_BYTES = (() => {
  const mb = Number(process.env.HOME_UPLOAD_MAX_MB ?? '25')
  return (isNaN(mb) || mb < 1 ? 25 : mb) * 1024 * 1024
})()

const KIND_OPTS: Record<string, { maxSize: number; quality: number }> = {
  logo: { maxSize: 900, quality: 92 },
  hero: { maxSize: 2600, quality: 82 },
  portfolio: { maxSize: 1600, quality: 82 },
  poster: { maxSize: 1920, quality: 82 },
  generic: { maxSize: 2000, quality: 82 },
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
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    const maxMB = Math.round(MAX_BYTES / (1024 * 1024))
    return NextResponse.json({ error: `Image too large (max ${maxMB}MB)` }, { status: 400 })
  }

  const kind = (typeof form.get('kind') === 'string' ? form.get('kind') : 'generic') as string
  const opts = KIND_OPTS[kind] ?? KIND_OPTS.generic

  const buffer = Buffer.from(await file.arrayBuffer())

  let meta
  try {
    meta = await sharp(buffer).metadata()
  } catch {
    return NextResponse.json({ error: 'Not a valid image' }, { status: 500 })
  }
  if (!meta.width || !meta.height) {
    return NextResponse.json({ error: 'Not a valid image' }, { status: 500 })
  }

  try {
    let pipeline = sharp(buffer).rotate()
    if (meta.width > opts.maxSize) {
      pipeline = pipeline.resize({ width: opts.maxSize, withoutEnlargement: true })
    }

    let webpBuffer: Buffer
    try {
      webpBuffer = await pipeline.clone().webp({ quality: opts.quality, effort: 4 }).toBuffer()
      await sharp(webpBuffer).metadata()
    } catch {
      webpBuffer = Buffer.alloc(0)
    }

    const isTransparent = kind === 'logo' || file.type === 'image/png'
    const fallbackBuffer = await (isTransparent
      ? pipeline.clone().png({ compressionLevel: 9 })
      : pipeline.clone().jpeg({ quality: 88, mozjpeg: true })
    ).toBuffer()

    const useWebp = webpBuffer.length > 0 && webpBuffer.length <= fallbackBuffer.length
    const ext = useWebp ? 'webp' : kind === 'logo' || file.type === 'image/png' ? 'png' : 'jpg'
    const output = useWebp ? webpBuffer : fallbackBuffer

    const verified = await sharp(output)
      .metadata()
      .catch(() => null)
    if (!verified || !verified.width) {
      return NextResponse.json({ error: 'Optimization produced invalid output' }, { status: 500 })
    }

    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
    const rel = `images/${name}`
    const src = await writeUploadAsset(rel, output)

    return NextResponse.json({
      ok: true,
      src,
      bytes: output.length,
      format: ext,
      meta: {
        width: verified.width,
        height: verified.height,
        format: ext,
        bytes: output.length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image optimization failed; original was not touched' }, { status: 500 })
  }
}
