import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Get a Quotation',
  description:
    'Build your custom TJ Photography wedding or engagement quotation — packages, add-ons and instant estimate.',
  // Standalone lead-capture funnel: never indexed, never followed.
  robots: { index: false, follow: false },
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-serif text-lg tracking-wide text-foreground transition-colors hover:text-gold"
          >
            TJ PHOTOGRAPHY
          </Link>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70">
            Quotation
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6">
        <p className="mx-auto w-full max-w-4xl px-4 text-center text-sm text-foreground/70">
          © TJ PHOTOGRAPHY · Jamnagar
        </p>
      </footer>
    </div>
  )
}
