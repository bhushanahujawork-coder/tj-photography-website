'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, setGuestSession } from '@/lib/api'

/**
 * Shared client/guest sign-in modal: selfie/liveness (optional) → phone OTP →
 * verify. The verified session is persisted under the guest key (`share-auth`)
 * so it never collides with the photographer's `auth` session.
 *
 * When `shareCode` is provided the verification links the guest to that
 * wedding (share link); otherwise the backend auto-links any participant
 * invitation rows carrying the phone number.
 */
export default function GuestLoginModal({ open, onClose, onAuthed, livenessRequired = false, shareCode }: {
  open: boolean
  onClose: () => void
  onAuthed: () => void
  livenessRequired?: boolean
  shareCode?: string
}) {
  const { toast } = useToast()
  const [step, setStep] = useState<'selfie' | 'phone' | 'otp'>(livenessRequired ? 'selfie' : 'phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [selfieError, setSelfieError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    Promise.resolve().then(() => setStep(livenessRequired ? 'selfie' : 'phone'))
  }, [open, livenessRequired])

  useEffect(() => {
    if (!open || step !== 'selfie') {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      return
    }
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = (err as { name?: string })?.name || ''
        if (name === 'NotAllowedError') setSelfieError('Camera access was blocked. Please allow camera access to continue.')
        else if (name === 'NotFoundError') setSelfieError('No camera found on this device.')
        else setSelfieError('Could not access your camera. Please try again.')
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [open, step])

  const reset = () => {
    setStep(livenessRequired ? 'selfie' : 'phone')
    setPhone('')
    setOtp('')
    setError(null)
    setSelfieError(null)
  }

  const captureSelfie = () => {
    const video = videoRef.current
    if (!video) { setSelfieError('Camera not ready. Please try again.'); return }
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 640
    const ctx = canvas.getContext('2d')
    if (!ctx) { setSelfieError('Could not capture the image.'); return }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (!blob) { setSelfieError('Could not capture the image.'); return }
      setLoading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('image', blob, 'selfie.png')
        const res = await apiFetch<{ verified: boolean; confidence?: number; message?: string }>(
          `/api/v1/auth/selfie/liveness`,
          { method: 'POST', body: formData },
        )
        if (res.verified) {
          setStep('phone')
        } else {
          setSelfieError('Verification failed. Please try again with better lighting.')
        }
      } catch {
        setSelfieError('Could not verify the selfie. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 'image/png')
  }

  const handleSend = async () => {
    if (phone.trim().length < 10) {
      setError('Enter a valid phone number')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/v1/auth/otp/send`, {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      })
      setStep('otp')
    } catch {
      setError('Could not send the code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (otp.trim().length < 4) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string; expiresAt: string; user: unknown }>(
        `/api/v1/auth/otp/verify`,
        {
          method: 'POST',
          body: JSON.stringify({
            phone: phone.trim(),
            otp_code: otp.trim(),
            ...(shareCode ? { share_code: shareCode } : {}),
          }),
        },
      )
      try {
        setGuestSession({
          token: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
          user: res.user as { id?: string; name?: string; phone?: string } | null,
        })
      } catch { }
      toast({ title: 'Welcome to your wedding gallery', variant: 'success' })
      onAuthed()
      reset()
    } catch {
      setError('That code did not work. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={step === 'selfie' ? 'Verify Identity' : 'Love a photo?'} description={step === 'selfie' ? 'Complete a quick selfie check to access the gallery.' : 'Sign in with your phone to like photos. No account needed.'} size="sm">
      {step === 'selfie' ? (
        <div className="space-y-4">
          <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-2 border-gold/40 bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-gold/70" />
          </div>
          {selfieError && <p className="text-center text-xs text-red-400">{selfieError}</p>}
          <Button className="w-full" onClick={captureSelfie} disabled={loading}>
            <Icon name="camera" size={16} />
            {loading ? 'Analyzing…' : 'Capture Selfie'}
          </Button>
          <p className="text-center text-[11px] text-muted">
            This helps us confirm you are a real person. Your selfie is only used for verification.
          </p>
        </div>
      ) : step === 'phone' ? (
        <div className="space-y-4">
          <Input
            type="tel"
            inputMode="tel"
            placeholder="Phone number (e.g. 98765 43210)"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button className="w-full" onClick={handleSend} disabled={loading || phone.trim().length < 10}>
            <Icon name="message" size={16} />
            {loading ? 'Sending…' : 'Send OTP'}
          </Button>
          <p className="text-center text-[11px] text-muted">
            You will receive a one-time code on your phone.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => { setOtp(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleVerify() }}
            className="text-center text-lg tracking-[0.4em]"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button className="w-full" onClick={handleVerify} disabled={loading || otp.trim().length < 4}>
            <Icon name="check" size={16} />
            {loading ? 'Signing in…' : 'Verify & Continue'}
          </Button>
          <button
            onClick={() => { setStep('phone'); setError(null); setOtp('') }}
            className="mx-auto block text-xs text-muted hover:text-foreground transition-colors"
          >
            Change phone number
          </button>
        </div>
      )}
    </Modal>
  )
}