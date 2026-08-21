'use client'

const addressLines = [
  'UNICORN PRIME, 414,',
  'Near Honda Showroom,',
  'Jamnagar – Lalpur Road,',
  'Jamnagar, Gujarat 361006',
]

const links = [
  {
    label: '090333 20304',
    href: 'tel:09033320304',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  },
  {
    label: '@tj_photography_____',
    href: 'https://www.instagram.com/tj_photography_____/',
    external: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
]

export default function ContactSection() {
  return (
    <section id="contact" className="relative w-full bg-[#eae1d2] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-gold-dark text-[11px] md:text-xs tracking-[0.3em] uppercase font-medium">
            Visit Our Office
          </span>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground tracking-wide">
            Find TJ Photography in Jamnagar
          </h2>
          <div className="w-14 h-px bg-gold-dark mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <div className="relative w-full min-h-[300px] md:min-h-[420px] rounded-xl overflow-hidden border border-gold/25 shadow-lg shadow-black/10">
            <span aria-hidden className="absolute top-0 left-0 z-10 w-5 h-5 border-t-2 border-l-2 border-gold rounded-tl-xl" />
            <span aria-hidden className="absolute top-0 right-0 z-10 w-5 h-5 border-t-2 border-r-2 border-gold rounded-tr-xl" />
            <span aria-hidden className="absolute bottom-0 left-0 z-10 w-5 h-5 border-b-2 border-l-2 border-gold rounded-bl-xl" />
            <span aria-hidden className="absolute bottom-0 right-0 z-10 w-5 h-5 border-b-2 border-r-2 border-gold rounded-br-xl" />
            <iframe
              src="https://www.google.com/maps?q=22.4236237,70.067044&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="TJ Photography Office Location"
            />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=22.4236237,70.067044"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 bg-black/75 backdrop-blur-md text-white text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded-full border border-gold/40 hover:bg-black transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Open in Maps
            </a>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-gold/25 bg-white/40 p-6 md:p-9">
            <div className="flex items-start gap-4 rounded-xl border border-gold/15 bg-white/50 p-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gold-dark shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div className="text-foreground/80 text-sm md:text-[15px] font-light leading-relaxed">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-4">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="flex items-center gap-4 text-foreground/70 hover:text-gold-dark transition-colors duration-300"
                >
                  {link.icon}
                  <span className="text-sm md:text-base font-light">{link.label}</span>
                </a>
              ))}
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=22.4236237,70.067044"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-gold text-black px-8 py-3.5 text-xs md:text-sm font-semibold tracking-wider uppercase hover:bg-gold-light transition-colors duration-300"
            >
              Get Direction
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
