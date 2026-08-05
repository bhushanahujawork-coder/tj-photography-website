'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { AppSettings, GalleryVisibility } from '@/types/platform'

const dateFormatOptions = [
  { label: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD Month YYYY', value: 'DD Month YYYY' },
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

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Hidden', value: 'hidden' },
]

const watermarkPositionOptions = [
  { label: 'Top Left', value: 'top-left' },
  { label: 'Top Right', value: 'top-right' },
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Bottom Right', value: 'bottom-right' },
  { label: 'Center', value: 'center' },
]

const typographyOptions = [
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
]

const settingsTabs = [
  { label: 'General', value: 'general' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Downloads', value: 'downloads' },
  { label: 'Branding', value: 'branding' },
  { label: 'Theme', value: 'theme' },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<AppSettings>('/api/v1/settings/')
      .then(data => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateGeneral = (key: string, value: string) =>
    setSettings(prev => prev ? { ...prev, general: { ...prev.general, [key]: value } } : prev)

  const updateGallery = (key: string, value: boolean | GalleryVisibility) =>
    setSettings(prev => prev ? { ...prev, gallery: { ...prev.gallery, [key]: value } } : prev)

  const updateDownloads = (key: string, value: boolean) =>
    setSettings(prev => prev ? { ...prev, downloads: { ...prev.downloads, [key]: value } } : prev)

  const updateBranding = (key: string, value: string | number) =>
    setSettings(prev => prev ? { ...prev, branding: { ...prev.branding, [key]: value } } : prev)

  const updateBrandingTypography = (key: 'headings' | 'body', value: string) =>
    setSettings(prev => prev ? {
      ...prev,
      branding: { ...prev.branding, typography: { ...prev.branding.typography, [key]: value } },
    } : prev)

  const updateTheme = (key: string, value: string) =>
    setSettings(prev => prev ? { ...prev, theme: { ...prev.theme, [key]: value } } : prev)

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await Promise.all([
        apiFetch('/api/v1/settings/gallery', {
          method: 'PUT',
          body: JSON.stringify({
            visibility: settings.gallery.visibility,
            download_enabled: settings.gallery.downloadEnabled,
            share_enabled: settings.gallery.shareEnabled,
            screenshot_protection: settings.gallery.screenshotProtection,
            anonymous_viewing: settings.gallery.anonymousViewing,
            watermark_enabled: settings.gallery.watermarkEnabled,
            pin_protection: settings.gallery.pinProtection,
          }),
        }),
        apiFetch('/api/v1/settings/downloads', {
          method: 'PUT',
          body: JSON.stringify({
            single_enabled: settings.downloads.singleEnabled,
            multiple_enabled: settings.downloads.multipleEnabled,
            bulk_enabled: settings.downloads.bulkEnabled,
            zip_enabled: settings.downloads.zipEnabled,
            pin_required: settings.downloads.pinRequired,
          }),
        }),
        apiFetch('/api/v1/settings/branding', {
          method: 'PUT',
          body: JSON.stringify({
            photographer_logo: settings.branding.photographerLogo,
            watermark_position: settings.branding.watermarkPosition,
            watermark_size: String(settings.branding.watermarkSize),
            watermark_type: settings.branding.watermarkType,
            watermark_text: settings.branding.watermarkText,
            gallery_theme: settings.branding.galleryTheme,
            primary_color: settings.branding.primaryColor,
            typography: settings.branding.typography,
          }),
        }),
        apiFetch('/api/v1/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({
            mode: settings.theme.mode,
            primary_color: settings.theme.primaryColor,
          }),
        }),
      ])
      toast({ title: 'Settings saved', description: 'Your changes have been applied successfully.', variant: 'success' })
    } catch {
      toast({ title: 'Failed to save settings', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  }

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />

      {!settings ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-pulse-soft rounded-full bg-gold/30" />
        </div>
      ) : (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted">Manage your application preferences</p>
          </div>
          <Button onClick={handleSave} loading={saving}>
            <Icon name="check" size={16} />
            Save Changes
          </Button>
        </div>

        <Tabs tabs={settingsTabs} value={activeTab} onChange={setActiveTab} className="mb-8" />

        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Site Name"
                  value={settings.general.siteName}
                  onChange={e => updateGeneral('siteName', e.target.value)}
                />
                <Select
                  label="Date Format"
                  options={dateFormatOptions}
                  value={settings.general.dateFormat}
                  onChange={e => updateGeneral('dateFormat', e.target.value)}
                />
                <Select
                  label="Timezone"
                  options={timezoneOptions}
                  value={settings.general.timezone}
                  onChange={e => updateGeneral('timezone', e.target.value)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Default Visibility"
                  options={visibilityOptions}
                  value={settings.gallery.visibility}
                  onChange={e => updateGallery('visibility', e.target.value as GalleryVisibility)}
                />
                <div className="space-y-3 pt-2">
                  <Switch
                    checked={settings.gallery.downloadEnabled}
                    onChange={v => updateGallery('downloadEnabled', v)}
                    label="Enable downloads"
                  />
                  <Switch
                    checked={settings.gallery.shareEnabled}
                    onChange={v => updateGallery('shareEnabled', v)}
                    label="Enable sharing"
                  />
                  <Switch
                    checked={settings.gallery.screenshotProtection}
                    onChange={v => updateGallery('screenshotProtection', v)}
                    label="Screenshot protection"
                  />
                  <Switch
                    checked={settings.gallery.watermarkEnabled}
                    onChange={v => updateGallery('watermarkEnabled', v)}
                    label="Watermark on photos"
                  />
                  <Switch
                    checked={settings.gallery.anonymousViewing}
                    onChange={v => updateGallery('anonymousViewing', v)}
                    label="Allow anonymous viewing"
                  />
                  <Switch
                    checked={settings.gallery.pinProtection}
                    onChange={v => updateGallery('pinProtection', v)}
                    label="PIN protection"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'downloads' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Switch
                  checked={settings.downloads.singleEnabled}
                  onChange={v => updateDownloads('singleEnabled', v)}
                  label="Single photo download"
                />
                <Switch
                  checked={settings.downloads.multipleEnabled}
                  onChange={v => updateDownloads('multipleEnabled', v)}
                  label="Multiple photo download"
                />
                <Switch
                  checked={settings.downloads.bulkEnabled}
                  onChange={v => updateDownloads('bulkEnabled', v)}
                  label="Bulk download"
                />
                <Switch
                  checked={settings.downloads.zipEnabled}
                  onChange={v => updateDownloads('zipEnabled', v)}
                  label="ZIP archive download"
                />
                <div className="pt-2">
                  <Switch
                    checked={settings.downloads.pinRequired}
                    onChange={v => updateDownloads('pinRequired', v)}
                    label="Require PIN for downloads"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'branding' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">Photographer Logo</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-gold/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                      <Icon name="upload" size={22} className="text-muted" />
                    </div>
                    <span className="text-sm text-muted">Click to upload logo</span>
                    <span className="text-xs text-muted/50">Recommended: 400x400px, PNG or SVG</span>
                    <input type="file" accept="image/png,image/svg+xml" className="hidden" />
                  </label>
                </div>

                <Select
                  label="Watermark Type"
                  options={[{ label: 'Text', value: 'text' }, { label: 'Logo', value: 'logo' }]}
                  value={settings.branding.watermarkType}
                  onChange={e => updateBranding('watermarkType', e.target.value)}
                />

                {settings.branding.watermarkType === 'text' && (
                  <Input
                    label="Watermark Text"
                    value={settings.branding.watermarkText}
                    onChange={e => updateBranding('watermarkText', e.target.value)}
                    placeholder="TJ Photography"
                  />
                )}

                <Select
                  label="Watermark Position"
                  options={watermarkPositionOptions}
                  value={settings.branding.watermarkPosition}
                  onChange={e => updateBranding('watermarkPosition', e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-muted">Watermark Size ({settings.branding.watermarkSize}%)</label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={settings.branding.watermarkSize}
                    onChange={e => updateBranding('watermarkSize', Number(e.target.value))}
                    className="w-full accent-gold"
                  />
                  <div className="flex justify-between text-xs text-muted/50">
                    <span>5%</span>
                    <span>30%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-muted">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.branding.primaryColor}
                      onChange={e => updateBranding('primaryColor', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
                    />
                    <span className="text-sm text-muted font-mono">{settings.branding.primaryColor}</span>
                  </div>
                </div>

                <Select
                  label="Heading Font"
                  options={typographyOptions}
                  value={settings.branding.typography.headings}
                  onChange={e => updateBrandingTypography('headings', e.target.value)}
                />

                <Select
                  label="Body Font"
                  options={typographyOptions}
                  value={settings.branding.typography.body}
                  onChange={e => updateBrandingTypography('body', e.target.value)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'theme' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                      <Icon name={settings.theme.mode === 'dark' ? 'star' : 'eye'} size={20} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Dark Mode</p>
                      <p className="text-xs text-muted">Switch between dark and light appearance</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.theme.mode === 'dark'}
                    onChange={v => updateTheme('mode', v ? 'dark' : 'light')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-muted">Theme Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.theme.primaryColor}
                      onChange={e => updateTheme('primaryColor', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
                    />
                    <span className="text-sm text-muted font-mono">{settings.theme.primaryColor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
      )}
    </AuthGuard>
  )
}
