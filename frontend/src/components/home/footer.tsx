'use client'

import { useHomeConfig } from '@/lib/home-config/client'
import type { FooterSocialConfig } from '@/lib/home-config/types'

function SocialIcon({ type }: { type: FooterSocialConfig['type'] }) {
  if (type === 'instagram') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 17.48a5.44 5.44 0 0 1-2.98-.9l-3.42 1.1 1.1-3.33a5.44 5.44 0 1 1 5.3 3.13m6.51-6.02a6.57 6.57 0 0 0-11.17-4.88 6.57 6.57 0 0 0-.95 8.27l-1.2 3.68 3.8-1.22a6.57 6.57 0 0 0 9.52-5.85Zm.6-6.12A7.57 7.57 0 0 0 12.04 1C4.88 1 1.32 7.27 1.32 12.06c0 1.5.38 2.97 1.11 4.27L1 20.17l4.12-1.32a11.56 11.56 0 0 0 6.92 1.2c7.15 0 10.73-6.26 10.73-11.06a6.56 6.56 0 0 0-1.4-4.65Z" />
    </svg>
  )
}

export default function Footer() {
  const { config } = useHomeConfig()
  const { footer } = config
  return (
    <footer className="relative w-full bg-[#eae1d2] border-t border-gold/15">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 2xl:max-w-[1400px] 3xl:max-w-[1700px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <h3 className="flex items-baseline gap-1.5 font-[var(--font-poppins)] text-lg xl:text-xl text-foreground tracking-[0.08em] uppercase">
              <span className="font-bold">{footer.brandLeft}</span>
              <span className="font-medium">{footer.brandRight}</span>
            </h3>
          </div>

          <div className="flex items-center gap-5">
            {footer.social.map((s) => (
              <a
                key={s.type}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
                aria-label={s.label}
              >
                <SocialIcon type={s.type} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-muted/60 text-[10px] tracking-[0.3em] uppercase">
            <span>
              &copy; {footer.copyrightYear} {footer.brandLeft} {footer.brandRight}
            </span>
            <span aria-hidden className="hidden sm:inline">&middot;</span>
            <span>{footer.rightsLine}</span>
            <span aria-hidden className="hidden sm:inline">&middot;</span>
            <span>{footer.designerLine}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}