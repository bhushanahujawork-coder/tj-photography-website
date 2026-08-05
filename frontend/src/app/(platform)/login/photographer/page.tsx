'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function PhotographerLoginPage() {
  const router = useRouter()
  const { loginWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const success = await loginWithEmail(email)
    if (success) router.replace('/dashboard')
    else router.push('/login/otp')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />

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
            <span className="font-serif text-xl text-foreground">TJ Photography</span>
          </Link>
          <h1 className="font-serif text-2xl text-foreground">Photographer Login</h1>
          <p className="mt-2 text-sm text-muted">Access your studio dashboard</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@tjphotography.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button className="w-full" onClick={handleSubmit} loading={loading}>
              Sign In
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-xs text-muted hover:text-gold transition-colors">
                Customer Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
