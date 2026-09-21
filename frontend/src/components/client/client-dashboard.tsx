'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, clearGuestSession, getGuestSession, type ApiError } from '@/lib/api'
import ClientLoginModal from '@/components/client/client-login-modal'

interface ClientGallery {
  id: string
  weddingName: string
  weddingCode: string
  weddingDate?: string
  location?: string
  coverImageUrl?: string | null
}

export default function ClientDashboard() {
  const { toast } = useToast()
  const [galleries, setGalleries] = useState<ClientGallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [authed, setAuthed] = useState(false)

  const load = useCallback(async () => {
    const session = getGuestSession()
    if (!session?.token) {
      setAuthed(false)
      setGalleries([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<unknown>(`/api/v1/client/galleries`)
      const raw = Array.isArray(res) ? (res as Array<Record<string, unknown>>) : []
      const normalized = raw.map((r) => ({
        id: String(r.id ?? r.gallery_id ?? ''),
        weddingName: String(r.weddingName ?? r.wedding_name ?? ''),
        weddingCode: String(r.weddingCode ?? r.wedding_code ?? ''),
        weddingDate: r.weddingDate ? String(r.weddingDate) : r.wedding_date ? String(r.wedding_date) : undefined,
        location: r.location ? String(r.location) : undefined,
        coverImageUrl: r.coverImageUrl ? String(r.coverImageUrl) : r.cover_image_url ? String(r.cover_image_url) : undefined,
      }))
      setGalleries(normalized)
      setAuthed(true)
    } catch (e) {
      const err = e as ApiError
      setError(err?.backendMessage ?? 'Could not load your galleries.')
      if (err?.status === 401 || err?.code === 'unauthorized') {
        clearGuestSession()
        setAuthed(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleAuthed = useCallback(() => {
    setLoginOpen(false)
    void load()
  }, [load])

  const handleSignOut = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // ignore — local session clear always runs
    }
    clearGuestSession()
    setGalleries([])
    setAuthed(false)
    toast({ title: 'Signed out', variant: 'success' })
  }

  return (
    <main className="min-h-dvh bg-[var(--home-bg,#eae1d2)] px-6 py-24 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Client</p>
            <h1 className="font-serif text-4xl">Meri Galleries</h1>
            <p className="text-sm text-muted">Your wedding galleries, in one place.</p>
          </div>
          {authed && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
              <Icon name="logout" size={14} />
              Sign out
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}

        {!loading && !authed && (
          <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white/60 p-10 text-center shadow-sm backdrop-blur">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Icon name="heart" size={22} className="text-gold" />
            </div>
            <h2 className="font-serif text-2xl">Welcome back</h2>
            <p className="mt-2 text-sm text-muted">
              Log in with your phone to see galleries shared with you by TJ Photography.
            </p>
            <Button className="mt-6 w-full gap-2" onClick={() => setLoginOpen(true)}>
              <Icon name="phone" size={14} />
              Verify my number
            </Button>
          </div>
        )}

        {!loading && authed && galleries.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-black/15 p-10 text-center">
            <Icon name="camera" size={26} className="mx-auto mb-3 text-gold" />
            <p className="font-serif text-xl">No galleries yet</p>
            <p className="mt-1 text-sm text-muted">
              When TJ shares a wedding with you, it appears here.
            </p>
          </div>
        )}

        {authed && galleries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => (
              <Link
                key={g.id}
                href={`/gallery/${g.weddingCode}/view`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
              >
                <div className="relative h-44">
                  {g.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.coverImageUrl}
                      alt={g.weddingName}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold/20 to-transparent">
                      <Icon name="camera" size={34} className="text-gold" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full border border-gold/50 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold backdrop-blur">
                    {g.weddingCode}
                  </span>
                </div>
                <div className="space-y-1.5 p-6">
                  <h3 className="font-serif text-xl">{g.weddingName}</h3>
                  {g.weddingDate && (
                    <p className="text-xs text-muted">
                      {new Date(g.weddingDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                  {g.location && <p className="text-xs text-muted">{g.location}</p>}
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gold">
                    Open gallery <Icon name="arrow-right" size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {error && !authed && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}
      </div>

      <ClientLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onAuthed={handleAuthed}
      />
    </main>
  )
}
