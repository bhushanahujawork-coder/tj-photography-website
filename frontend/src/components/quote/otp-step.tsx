'use client'

import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import { sendEnquiryOtp, verifyEnquiryOtp } from '@/lib/api-quotation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'

const PHONE_RE = /^[6-9]\d{9}$/

interface OtpStepProps {
  onVerified: () => void
}

export function OtpStep({ onVerified }: OtpStepProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [demoOtp, setDemoOtp] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const startCooldown = () => setCooldown(30)

  const send = async () => {
    if (!PHONE_RE.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await sendEnquiryOtp(phone)
      setSent(true)
      setDemoOtp(res.demoOtp)
      setOtp(res.demoOtp || '')
      startCooldown()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.backendMessage : 'Could not send OTP. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.')
      return
    }
    setVerifying(true)
    setError(null)
    try {
      await verifyEnquiryOtp(phone, otp)
      onVerified()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.backendMessage : 'Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-foreground">Verify your phone</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/70">
          We&apos;ll send a 6-digit OTP to continue. No spam, ever.
        </p>
      </div>

      <Input
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        disabled={sent}
      />

      {sent && (
        <div className="space-y-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
          {demoOtp && (
            <p className="text-sm text-foreground/80">
              Demo mode — OTP:{' '}
              <span className="font-mono text-base font-bold text-foreground">{demoOtp}</span>{' '}
              (SMS disabled)
            </p>
          )}
          <Input
            label="Enter OTP"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex items-center gap-3">
            <Button onClick={verify} loading={verifying} disabled={verifying}>
              Verify & Continue
            </Button>
            <Button
              variant="ghost"
              onClick={send}
              disabled={sending || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </Button>
          </div>
        </div>
      )}

      {!sent && (
        <Button onClick={send} loading={sending} disabled={sending}>
          Send OTP
        </Button>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <Icon name="alert-circle" size={14} />
          {error}
        </p>
      )}
    </div>
  )
}
