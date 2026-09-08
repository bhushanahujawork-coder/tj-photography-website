'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    })
    setBusy(false)
    if (res.ok) {
      router.replace('/admin/editor')
    } else {
      setError('Invalid ID or password')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gold/25 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-sm p-8">
          <div className="text-center mb-7">
            <h1 className="font-serif text-2xl text-foreground tracking-wide">
              TJ Photography
            </h1>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-muted">
              Homepage Admin Control
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted">Admin ID</span>
              <input
                className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                placeholder="Admin ID"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted">Password</span>
              <input
                type="password"
                className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
              />
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 rounded-lg bg-gold py-2.5 text-sm font-semibold uppercase tracking-wider text-black hover:bg-gold-light disabled:opacity-50 transition-colors"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted/70">
          Admin only — public homepage is not affected
        </p>
      </div>
    </div>
  )
}