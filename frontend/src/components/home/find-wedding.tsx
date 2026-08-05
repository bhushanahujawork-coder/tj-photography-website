'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { findWedding } from '@/data/homepage'
import SectionHeading from '@/components/ui/section-heading'

type LoginMethod = 'code' | 'phone' | 'email' | 'google'

export default function FindWedding() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('code')

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
    setCode(value)
    if (error) setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setIsLoading(true)
    setError(null)
    setTimeout(() => {
      router.push(`/gallery/${code}`)
    }, 500)
  }

  const methodButtons: { key: LoginMethod; label: string; icon: string }[] = [
    { key: 'code', label: 'Wedding Code', icon: '\uD83D\uDD11' },
    { key: 'phone', label: 'Phone', icon: '\uD83D\uDCF1' },
    { key: 'email', label: 'Email', icon: '\u2709\uFE0F' },
    { key: 'google', label: 'Google', icon: 'G' },
  ]

  return (
    <section id="wedding" className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-lg mx-auto px-6">
        <SectionHeading title={findWedding.title} description={findWedding.description} />

        <motion.div
          className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex flex-wrap gap-2 mb-8">
            {methodButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActiveMethod(btn.key)}
                className={`flex-1 min-w-[80px] py-2.5 px-3 text-xs rounded-lg font-medium transition-all duration-300 tracking-wide ${
                  activeMethod === btn.key
                    ? 'bg-gold text-black'
                    : 'bg-white/5 text-white/50 hover:text-white/80 border border-white/10'
                }`}
              >
                <span className="block mb-0.5">{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>

          {activeMethod === 'code' && (
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Enter your wedding code"
                  className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-foreground placeholder:text-white/20 text-sm text-center tracking-widest focus:outline-none focus:ring-2 transition-all duration-300 ${
                    error
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/10 focus:ring-gold/50 focus:border-gold'
                  }`}
                  maxLength={12}
                  aria-label="Wedding code"
                  aria-invalid={!!error}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <motion.p
                  className="mt-3 text-xs text-red-400 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
              <motion.button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full h-12 mt-4 bg-gold text-black font-semibold text-sm tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  'Find My Photos'
                )}
              </motion.button>
            </form>
          )}

          {activeMethod === 'phone' && (
            <p className="text-white/40 text-sm text-center py-4 font-light">
              Phone authentication coming soon.
            </p>
          )}

          {activeMethod === 'email' && (
            <p className="text-white/40 text-sm text-center py-4 font-light">
              Email authentication coming soon.
            </p>
          )}

          {activeMethod === 'google' && (
            <p className="text-white/40 text-sm text-center py-4 font-light">
              Google login coming soon.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
