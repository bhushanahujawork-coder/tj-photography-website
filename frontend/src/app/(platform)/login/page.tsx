'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

const loginMethods = [
  { id: 'phone', label: 'Phone Number', icon: 'phone', description: 'Login with OTP via SMS' },
  { id: 'email', label: 'Email Address', icon: 'mail', description: 'Login with OTP via email' },
] as const

export default function LoginPage() {
  const router = useRouter()
  const { loginWithPhone, loginWithEmail, loginWithGoogle, isAuthenticated } = useAuth()
  const [method, setMethod] = useState<'phone' | 'email' | null>(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    router.replace('/dashboard')
    return null
  }

  const handleSubmit = async () => {
    setLoading(true)
    let loggedIn = false
    if (method === 'phone') loggedIn = await loginWithPhone(value)
    else if (method === 'email') loggedIn = await loginWithEmail(value)
    if (loggedIn) {
      router.replace('/dashboard')
    } else {
      router.push('/login/otp')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-base font-bold text-black">
              TJ
            </div>
            <span className="font-serif text-xl text-foreground">TJ Photography</span>
          </Link>
          <h1 className="font-serif text-3xl text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to access your wedding gallery</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          {!method ? (
            <div className="space-y-3">
              {loginMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as 'phone' | 'email')}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-gold/30 hover:bg-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Icon name={m.icon} size={20} className="text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted">{m.description}</p>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-muted" />
                </button>
              ))}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted">OR</span></div>
              </div>

              <Button variant="outline" className="w-full" onClick={async () => { setLoading(true); const ok = await loginWithGoogle(); if (ok) router.replace('/dashboard'); setLoading(false); }} loading={loading}>
                <Icon name="google" size={18} />
                Continue with Google
              </Button>

              <div className="mt-6 text-center">
                <Link href="/login/photographer" className="text-xs text-muted hover:text-gold transition-colors">
                  Photographer Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setMethod(null)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <Icon name="arrow-left" size={16} />
                Back
              </button>

              <Input
                label={method === 'phone' ? 'Phone Number' : 'Email Address'}
                type={method === 'phone' ? 'tel' : 'email'}
                placeholder={method === 'phone' ? '+1 (555) 000-0000' : 'you@example.com'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                icon={method === 'phone' ? <Icon name="phone" size={16} /> : <Icon name="mail" size={16} />}
              />

              <Button className="w-full" onClick={handleSubmit} loading={loading}>
                Send OTP
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          By signing in, you agree to our{' '}
          <Link href="#" className="text-gold hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="#" className="text-gold hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  )
}
