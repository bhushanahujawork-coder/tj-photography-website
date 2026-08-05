'use client'

export default function ContactSection() {
  return (
    <section id="contact" className="relative w-full bg-black py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl md:text-3xl text-white tracking-wide">
            Visit Our Office
          </h3>
          <div className="w-12 h-px bg-gold mx-auto mt-4 mb-2" />
          <p className="text-white/40 text-sm font-light">
            UNICORN PRIME, 414, Near Hona Showroom, Jamnagar - Lalpur Rd, Jamnagar, Gujarat 361006
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border border-gold/20">
            <iframe
              src="https://www.google.com/maps?q=TJ+Photography+Jamnagar&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="TJ Photography Office Location"
            />
          </div>

          <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
            <div className="flex flex-col gap-6 mb-8">
              <a
                href="tel:09033320304"
                className="flex items-center gap-4 text-white/60 hover:text-gold transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="text-sm md:text-base font-light">090333 20304</span>
              </a>

              <a
                href="https://www.instagram.com/tj_photography_____/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-white/60 hover:text-gold transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-sm md:text-base font-light">@tj_photography_____</span>
              </a>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=UNICORN+PRIME+414+Near+Hona+Showroom+Jamnagar+Lalpur+Rd+Jamnagar+Gujarat+361006"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gold text-black px-8 py-3 text-sm font-semibold tracking-wider hover:bg-gold/90 transition-colors duration-300"
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