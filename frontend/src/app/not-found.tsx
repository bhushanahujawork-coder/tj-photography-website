import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#eae1d2] px-6 text-center">
      <p className="font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.3em] text-gold">
        TJ Photography
      </p>
      <h1 className="mt-4 font-serif text-7xl text-[#161616] md:text-8xl">404</h1>
      <p className="mt-4 max-w-md font-serif text-xl text-[#161616]/80">
        This frame doesn&apos;t exist.
      </p>
      <p className="mt-2 max-w-md text-sm text-[#161616]/60">
        The page you&apos;re looking for was moved or never captured.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#161616] px-6 py-3 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-gold hover:text-black"
        >
          Back to Home
        </Link>
        <Link
          href="/quickportfolio"
          className="rounded-full border border-[#161616]/20 px-6 py-3 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-[#161616] transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          View Portfolio
        </Link>
      </div>
    </main>
  )
}
