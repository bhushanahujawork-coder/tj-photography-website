'use client'

import type { MediaMeta } from '@/lib/home-config/types'

export const IMAGE_MAX_BYTES = 25 * 1024 * 1024
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime']

export async function uploadMedia(
  file: File,
  kind: 'logo' | 'hero' | 'portfolio' | 'poster' | 'video'
): Promise<{ src: string; bytes: number; format: string; meta?: MediaMeta }> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('kind', kind)
  const endpoint = kind === 'video' ? '/api/upload/video' : '/api/upload/image'
  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', body: fd })
  } catch {
    throw new Error('Upload failed — check your network connection.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Session expired — refresh the editor and log in again.')
    }
    throw new Error(data?.error || 'Upload failed. Try again.')
  }
  return data
}