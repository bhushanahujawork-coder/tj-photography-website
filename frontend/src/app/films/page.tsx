'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/home/navbar'
import WhatsappFloat from '@/components/home/whatsapp-float'
import { films } from '@/data/films'

function YoutubeCard({
  index,
  onOpen,
}: {
  index: number
  onOpen: (embedId: string, title: string) => void
}) {
  const video = films[index]
  const [useMaxres, setUseMaxres] = useState(true)
  const thumbnail = video.embedId
    ? `https://img.youtube.com/vi/${video.embedId}/${useMaxres ? 'maxresdefault' : 'hqdefault'}.jpg`
    : ''

  const handleClick = () => {
    if (video.embedId) onOpen(video.embedId, video.title)
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={handleClick}
    >
      <div className="film-card-scoop relative bg-[#f7f6f3] rounded-[18px] p-[13px] transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-red-500/30">
        <div className="relative aspect-[13/9] bg-[#1a1510] rounded-[16px] overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={video.title}
              width={1280}
              height={720}
              onError={() => setUseMaxres(false)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/40 text-[10px] tracking-wider">
                {video.title}
              </span>
            </div>
          )}
        </div>

        <div className="px-[11px] pt-[10px] pb-[18px]">
          <h3 className="text-[15px] md:text-[19px] font-semibold text-[#1f2428] leading-tight">
            {video.couple}
          </h3>
          <div className="mt-[20px] md:mt-[24px] h-px w-[195px] bg-[#e5e2dc]" />
          <p className="mt-[12px] md:mt-[14px] text-[9px] md:text-[11px] leading-[1.5] text-[#8a857e] line-clamp-2">
            {video.description}
          </p>
        </div>
      </div>

      <span className="absolute -right-4 -bottom-2 w-12 h-12 md:w-[72px] md:h-[72px] rounded-full bg-[#f7f6f3] shadow-lg flex items-center justify-center transition-all duration-300 group-hover:bg-[#FF0000] group-hover:shadow-xl group-hover:shadow-red-500/50">
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-[#1f2428] transition-colors duration-300 group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </span>
    </div>
  )
}

function FilmsFooter() {
  return (
    <footer className="relative w-full bg-[#0a0a0a] border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/tj_photography_____/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 010-10 2 2 0 011.4-1.4 49.56 49.56 0 0116.2 0A2 2 0 0121.5 7a24.12 24.12 0 010 10 2 2 0 01-1.4 1.4 49.55 49.55 0 01-16.2 0A2 2 0 012.5 17z" />
                <path d="M10 9l5 3-5 3z" />
              </svg>
            </a>
          </div>

          <div className="border-t border-white/5 pt-8 w-full text-center">
            <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase">
              &copy; 2026 TJ Photography &nbsp;·&nbsp; All rights reserved &nbsp;·&nbsp; Designed by Bhushan Ahuja
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function FilmsPage() {
  const [active, setActive] = useState<{ embedId: string; title: string } | null>(null)

  const openFilm = (embedId: string, title: string) => {
    setActive({ embedId, title })
    document.body.style.overflow = 'hidden'
  }

  const closeFilm = () => {
    setActive(null)
    document.body.style.overflow = ''
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="relative w-full h-[45vh] md:h-[50vh]">
          <div className="absolute inset-0 bg-black">
            <video
              className="absolute inset-0 w-full h-full object-cover object-center"
              src="/cinema/cinema.mp4"
              poster="/cinema/poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="font-serif text-2xl md:text-4xl text-white tracking-wide">
              <Link href="/" className="hover:text-gold transition-colors duration-300">
                TJ Photography
              </Link>
            </h2>
            <div className="w-12 h-px bg-gold mt-4" />
            <p className="text-white/50 text-sm md:text-base mt-4 font-light">
              Cinematic stories of love
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 px-0">
          <div className="w-full px-6 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {films.map((_, i) => (
                <YoutubeCard key={i} index={i} onOpen={openFilm} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <div
        className={`fixed inset-0 z-[100] bg-black/95 flex-col items-center justify-center ${active ? 'flex' : 'hidden'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeFilm()
        }}
      >
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-light tracking-wide">
              {active?.title ?? 'Video'}
            </h3>
            <button
              onClick={closeFilm}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {active && (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${active.embedId}?autoplay=1`}
                title="YouTube video player"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>

      <FilmsFooter />
      <WhatsappFloat />
    </>
  )
}
