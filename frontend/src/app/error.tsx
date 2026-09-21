'use client'

import Link from 'next/link'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#eae1d2] px-6 text-center">
      <p className="font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.3em] text-gold">
        TJ Photography
      </p>
      <h1 className="mt-4 font-serif text-4xl text-[#161616] md:text-5xl">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#161616]/60">
        Please try again — if the problem persists, contact us on Instagram.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#161616] px-6 py-3 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-gold hover:text-black"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[#161616]/20 px-6 py-3 font-[var(--font-poppins)] text-[11px] uppercase tracking-[0.18em] text-[#161616] transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
