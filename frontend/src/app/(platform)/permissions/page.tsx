'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_PERMISSIONS } from '@/types/platform'
import type { Role, Permission } from '@/types/platform'

const roles: Role[] = ['admin', 'photographer', 'editor', 'client', 'guest']

const permissions: Permission[] = ['view', 'download', 'upload', 'delete', 'edit', 'share']

const permissionInfo: Record<Permission, string> = {
  view: 'View galleries and photos',
  download: 'Download photos and albums',
  upload: 'Upload photos to galleries',
  delete: 'Delete photos and albums',
  edit: 'Edit gallery settings and metadata',
  share: 'Share galleries with others',
}

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  photographer: 'Photographer',
  editor: 'Editor',
  client: 'Client',
  guest: 'Guest',
}

export default function PermissionsPage() {
  const { toast } = useToast()
  const [matrix, setMatrix] = useState<Record<Role, Record<Permission, boolean>>>(() => {
    const initial: Record<Role, Record<Permission, boolean>> = {} as Record<Role, Record<Permission, boolean>>
    for (const role of roles) {
      initial[role] = { ...DEFAULT_PERMISSIONS[role] }
    }
    return initial
  })
  const [saving, setSaving] = useState(false)

  const hasChanges = roles.some(role =>
    permissions.some(perm => matrix[role][perm] !== DEFAULT_PERMISSIONS[role][perm])
  )

  const togglePermission = (role: Role, permission: Permission) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission],
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast({ title: 'Permissions updated', description: 'Role permissions have been updated successfully.', variant: 'success' })
  }

  const handleReset = () => {
    const initial: Record<Role, Record<Permission, boolean>> = {} as Record<Role, Record<Permission, boolean>>
    for (const role of roles) {
      initial[role] = { ...DEFAULT_PERMISSIONS[role] }
    }
    setMatrix(initial)
  }

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Permissions' }]} />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Permissions</h1>
              <p className="mt-1 text-sm text-muted">Manage role-based access control for the platform</p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <Icon name="refresh" size={16} />
                  Reset
                </Button>
              )}
              <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
                <Icon name="check" size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 z-10 bg-card px-4 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Role
                      </th>
                      {permissions.map(perm => (
                        <th key={perm} className="px-4 py-4 text-center text-xs font-medium text-muted uppercase tracking-wider">
                          {perm}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, i) => (
                      <motion.tr
                        key={role}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 transition-colors hover:bg-white/5"
                      >
                        <td className="sticky left-0 z-10 bg-card px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-foreground">{roleLabels[role]}</span>
                          </div>
                        </td>
                        {permissions.map(perm => {
                          const isChecked = matrix[role][perm]
                          return (
                            <td key={perm} className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isChecked}
                                  onChange={() => togglePermission(role, perm)}
                                />
                              </div>
                            </td>
                          )
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Permission Descriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {permissions.map(perm => (
                  <div key={perm} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                      <Icon name="info" size={14} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{perm}</p>
                      <p className="text-xs text-muted">{permissionInfo[perm]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  )
}
