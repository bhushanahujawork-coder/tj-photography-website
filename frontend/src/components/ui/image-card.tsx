'use client'

import Image from 'next/image'
import type { ImageData } from '@/types'

interface ImageCardProps extends ImageData {
  priority?: boolean
  className?: string
  overlay?: string
}

export default function ImageCard({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  className = '',
  overlay,
}: ImageCardProps) {
  const hasImage = Boolean(src)

  const hasOverlay = !hasImage && overlay

  if (hasOverlay) {
    const match = overlay.match(/"([^"]+)"/)
    const quotedWord = match ? match[1] : null
    const before = match
      ? overlay.slice(0, match.index ?? 0).trim()
      : ''
    const after = match
      ? overlay.slice((match.index ?? 0) + match[0].length).trim()
      : ''

    return (
      <div
        className={`relative overflow-hidden bg-black flex flex-col items-center justify-center ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="flex flex-col items-center justify-center h-[40%] w-full gap-1">
          {before && (
            <div className="w-full max-w-[50%] text-left">
              <p className="text-white/50 text-[10px] md:text-xs font-light tracking-[0.15em]">
                {before}
              </p>
            </div>
          )}
          {quotedWord && (
            <p className="text-white text-xl md:text-3xl font-serif font-bold tracking-widest">
              &quot;{quotedWord}&quot;
            </p>
          )}
          {after && (
            <div className="w-full max-w-[50%] text-right">
              <p className="text-white/50 text-[10px] md:text-xs font-light tracking-[0.15em]">
                {after}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!hasImage) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2a2015] to-[#1a1a1a] ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-lg">{'\uD83D\uDCF7'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className="w-full h-full object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  )
}
