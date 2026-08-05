'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { generateWeddingCode } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
]

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Hidden', value: 'hidden' },
]

export default function NewWeddingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState({
    weddingName: '',
    brideName: '',
    groomName: '',
    weddingDate: '',
    location: '',
    weddingCode: generateWeddingCode(),
    status: 'draft',
    visibility: 'private',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.weddingName.trim()) errs.weddingName = 'Wedding name is required'
    if (!form.brideName.trim()) errs.brideName = 'Bride name is required'
    if (!form.groomName.trim()) errs.groomName = 'Groom name is required'
    if (!form.weddingDate) errs.weddingDate = 'Wedding date is required'
    if (!form.location.trim()) errs.location = 'Location is required'
    if (!form.weddingCode.trim()) errs.weddingCode = 'Wedding code is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      await apiFetch('/api/v1/weddings/', {
        method: 'POST',
        body: JSON.stringify({
          wedding_name: form.weddingName,
          bride_name: form.brideName,
          groom_name: form.groomName,
          wedding_date: new Date(form.weddingDate).toISOString(),
          location: form.location,
          wedding_code: form.weddingCode,
          status: form.status,
          visibility: form.visibility,
          cover_image: null,
        }),
      })
      toast({ title: 'Wedding created', description: `${form.weddingName} has been created successfully.`, variant: 'success' })
      router.push('/weddings')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create wedding'
      toast({ title: 'Error', description: msg, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Weddings', href: '/weddings' }, { label: 'New Wedding' }]} />

        <div>
          <h1 className="font-serif text-2xl text-foreground">Create Wedding</h1>
          <p className="mt-1 text-sm text-muted">Set up a new wedding gallery</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Wedding Name"
                placeholder="e.g. Sunset Elegance"
                value={form.weddingName}
                onChange={(e) => update('weddingName', e.target.value)}
                error={errors.weddingName}
              />
              <Input
                label="Wedding Code"
                placeholder="Auto-generated"
                value={form.weddingCode}
                onChange={(e) => update('weddingCode', e.target.value)}
                error={errors.weddingCode}
              />
              <Input
                label="Bride Name"
                placeholder="e.g. Sophia"
                value={form.brideName}
                onChange={(e) => update('brideName', e.target.value)}
                error={errors.brideName}
              />
              <Input
                label="Groom Name"
                placeholder="e.g. Alexander"
                value={form.groomName}
                onChange={(e) => update('groomName', e.target.value)}
                error={errors.groomName}
              />
              <Input
                label="Wedding Date"
                type="date"
                value={form.weddingDate}
                onChange={(e) => update('weddingDate', e.target.value)}
                error={errors.weddingDate}
              />
              <Input
                label="Location"
                placeholder="e.g. Tuscany, Italy"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                error={errors.location}
              />
              <Select
                label="Status"
                options={statusOptions}
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              />
              <Select
                label="Visibility"
                options={visibilityOptions}
                value={form.visibility}
                onChange={(e) => update('visibility', e.target.value)}
              />
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-muted">Cover Image</label>
              <div className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-gold/30 hover:bg-card">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">Click or drag to upload cover image</p>
                  <p className="mt-1 text-xs text-muted/50">Recommended: 1920x1080, max 5MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Save Wedding
            </Button>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  )
}
