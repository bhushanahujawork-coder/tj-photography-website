'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OTPPage() {
  const router = useRouter()
  const { verifyOTP } = useAuth()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(30)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer > 0) {
      const t = setInterval(() => setTimer((p) => p - 1), 1000)
      return () => clearInterval(t)
    }
  }, [timer])

  const handleChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[i] = value.slice(-1)
    setOtp(newOtp)
    if (value && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleSubmit = async () => {
    setLoading(true)
    const code = otp.join('')
    const success = await verifyOTP(code)
    if (success) router.replace('/dashboard')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-base font-bold text-black">
              TJ
            </div>
          </Link>
          <h1 className="font-serif text-2xl text-foreground">Enter OTP</h1>
          <p className="mt-2 text-sm text-muted">We&apos;ve sent a code to your device</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(ref) => { inputs.current[i] = ref }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-12 rounded-xl border border-border bg-background text-center text-xl text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            ))}
          </div>

          <Button className="w-full" onClick={handleSubmit} loading={loading} disabled={otp.some(d => !d)}>
            Verify Code
          </Button>

          <div className="mt-4 text-center">
            {timer > 0 ? (
              <p className="text-xs text-muted">Resend code in {timer}s</p>
            ) : (
              <button onClick={() => setTimer(30)} className="text-xs text-gold hover:underline">
                Resend Code
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
