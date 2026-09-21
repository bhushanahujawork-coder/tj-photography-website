'use client'

import { useState } from 'react'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { setGuestSession } from '@/lib/api'

// TEMP DEMO BYPASS (frontend only, backend OTP/selfie untouched):
// One-tap guest login until real OTP is wired for clients.
// Issues a local `demo-bypass` guest session; dashboard treats it as a
// valid empty session ("No galleries yet") instead of calling the API.
// TODO: restore phone OTP + selfie/liveness steps before production.
const DEMO_BYPASS_TOKEN = 'demo-bypass'

export function isDemoBypassSession(token?: string | null): boolean {
  return !!token && token.startsWith(DEMO_BYPASS_TOKEN)
}

export default function ClientLoginModal({ open, onClose, onAuthed }: {
  open: boolean
  onClose: () => void
  onAuthed: () => void
  livenessRequired?: boolean
  shareCode?: string
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    setLoading(true)
    try {
      setGuestSession({
        token: `${DEMO_BYPASS_TOKEN}-${Date.now()}`,
        refreshToken: '',
        expiresAt: '',
        user: { name: 'Guest' },
      })
    } catch { }
    toast({ title: 'Welcome to your wedding gallery', variant: 'success' })
    setLoading(false)
    onAuthed()
  }

  return (
    <Modal open={open} onClose={onClose} title="Love a photo?" description="One tap and you are in. No codes, no waiting." size="sm">
      <div className="space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <Icon name="heart" size={22} className="text-gold" />
        </div>
        <Button className="w-full gap-2" onClick={handleContinue} disabled={loading}>
          <Icon name="arrow-right" size={16} />
          {loading ? 'Opening…' : 'View My Galleries'}
        </Button>
        <p className="text-center text-[11px] text-muted">
          One-tap demo login &bull; OTP sign-in coming soon
        </p>
      </div>
    </Modal>
  )
}
