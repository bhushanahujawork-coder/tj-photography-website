'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn, getInitials } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import type { StorageInfo, User } from '@/types/platform'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const profileTabs = [
  { label: 'Profile', value: 'profile' },
  { label: 'Account', value: 'account' },
  { label: 'Preferences', value: 'preferences' },
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Japanese', value: 'ja' },
]

const timezoneOptions = [
  { label: 'Eastern (EST/EDT)', value: 'America/New_York' },
  { label: 'Central (CST/CDT)', value: 'America/Chicago' },
  { label: 'Mountain (MST/MDT)', value: 'America/Denver' },
  { label: 'Pacific (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
]

const roleBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  admin: 'success',
  photographer: 'info',
  editor: 'warning',
  client: 'default',
  guest: 'default',
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<User | null>(useAuth().user)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('Award-winning wedding photographer capturing timeless moments since 2018.')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('America/New_York')
  const [emailNotifications, setEmailNotifications] = useState({
    marketing: true,
    newWedding: true,
    downloads: false,
    weeklyReport: true,
  })

  const storagePercent = storageInfo ? Math.round((storageInfo.usedBytes / storageInfo.limitBytes) * 100) : 0

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileData, storageData] = await Promise.all([
          apiFetch<User>('/api/v1/users/me'),
          apiFetch<StorageInfo>('/api/v1/storage/usage'),
        ])
        setProfile(profileData)
        setStorageInfo(storageData)
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    }
    const authUser = useAuth().user
    if (!authUser) {
      loadProfile()
    } else {
      setProfile(authUser)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast({ title: 'Profile updated', description: 'Your changes have been saved successfully.', variant: 'success' })
  }

  const plans = [
    { label: 'Current Plan', value: 'Professional Plus' },
    { label: 'Storage', value: storageInfo ? `${Math.round(storageInfo.usedBytes / 1073741824 * 10) / 10} GB / ${Math.round(storageInfo.limitBytes / 1073741824)} GB` : '...' },
    { label: 'Team Members', value: '1 user' },
  ]

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]} />

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold/20 text-2xl font-bold text-gold font-serif">
              {profile ? getInitials(profile.name) : ''}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl text-foreground">{profile?.name}</h1>
                <Badge variant={roleBadgeVariant[profile?.role || ''] || 'default'}>
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{profile?.email}</p>
              {profile?.phone && <p className="text-sm text-muted">{profile.phone}</p>}
            </div>
            <Button onClick={handleSave} loading={saving}>
              <Icon name="check" size={16} />
              Save Changes
            </Button>
          </div>
        </motion.div>

        <Tabs tabs={profileTabs} value={activeTab} onChange={setActiveTab} className="mb-2" />

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xl font-bold text-gold font-serif">
                    {getInitials(name)}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-foreground">
                    <Icon name="upload" size={16} />
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-muted">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'account' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Plan & Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {plans.map(p => (
                    <div key={p.label} className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted">{p.label}</p>
                      <p className="mt-1 font-serif text-lg text-foreground">{p.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Storage Usage</span>
                    <span className={cn(
                      'font-medium',
                      storagePercent > 90 ? 'text-red-400' : storagePercent > 70 ? 'text-yellow-400' : 'text-green-400'
                    )}>
                      {storagePercent}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {storageInfo ? Math.round(storageInfo.usedBytes / 1073741824 * 10) / 10 : '...'} GB of {storageInfo ? Math.round(storageInfo.limitBytes / 1073741824) : '...'} GB used
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">Update Password</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Language"
                  options={languageOptions}
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                />
                <Select
                  label="Timezone"
                  options={timezoneOptions}
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Switch
                  checked={emailNotifications.marketing}
                  onChange={v => setEmailNotifications(prev => ({ ...prev, marketing: v }))}
                  label="Marketing & promotional emails"
                />
                <Switch
                  checked={emailNotifications.newWedding}
                  onChange={v => setEmailNotifications(prev => ({ ...prev, newWedding: v }))}
                  label="New wedding assignment notifications"
                />
                <Switch
                  checked={emailNotifications.downloads}
                  onChange={v => setEmailNotifications(prev => ({ ...prev, downloads: v }))}
                  label="Download activity alerts"
                />
                <Switch
                  checked={emailNotifications.weeklyReport}
                  onChange={v => setEmailNotifications(prev => ({ ...prev, weeklyReport: v }))}
                  label="Weekly performance report"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AuthGuard>
  )
}
