'use client'

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#eae1d2] border-t border-gold/15">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <h3 className="flex items-baseline gap-1.5 font-[var(--font-poppins)] text-lg text-foreground tracking-[0.08em] uppercase">
              <span className="font-bold">TJ</span>
              <span className="font-medium">Photography</span>
            </h3>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/tj_photography_____/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://wa.me/919033320304"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/50 transition-all duration-300"
              aria-label="WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border text-center">
          <p className="text-muted/60 text-[10px] tracking-[0.3em] uppercase">
            &copy; 2026 TJ Photography &nbsp;·&nbsp; All rights reserved &nbsp;·&nbsp; Designed by Bhushan Ahuja
          </p>
        </div>
      </div>
    </footer>
  )
}