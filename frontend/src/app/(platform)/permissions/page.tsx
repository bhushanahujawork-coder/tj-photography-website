'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { DEFAULT_PERMISSIONS } from '@/types/platform'
import type { Role, Permission, Wedding } from '@/types/platform'

const apiRoles: Role[] = ['photographer', 'editor', 'client', 'guest']

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

type MatrixState = Record<Role, Record<Permission, boolean>>

const fullMatrix = (): MatrixState => {
  const result = {} as MatrixState
  for (const role of roles) {
    result[role] = role === 'admin'
      ? { view: true, download: true, upload: true, delete: true, edit: true, share: true }
      : { ...DEFAULT_PERMISSIONS[role] }
  }
  return result
}

export default function PermissionsPage() {
  const { toast } = useToast()
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [selectedWedding, setSelectedWedding] = useState('')
  const [matrix, setMatrix] = useState<MatrixState>(fullMatrix)
  const [baseline, setBaseline] = useState<MatrixState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<{ items: Wedding[] }>('/api/v1/weddings/?page_size=100')
      .then(data => {
        setWeddings(data.items)
        if (data.items.length > 0) setSelectedWedding(data.items[0].id)
      })
      .catch(() => toast({ title: 'Could not load weddings', variant: 'error' }))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    if (!selectedWedding) return
    let cancelled = false
    Promise.resolve().then(() => setLoading(true))
    apiFetch<{ matrix: Partial<Record<Role, Record<Permission, boolean>>> }>(
      `/api/v1/weddings/${selectedWedding}/permissions/`
    )
      .then(res => {
        if (cancelled) return
        const next = fullMatrix()
        for (const role of apiRoles) {
          const row = res.matrix?.[role]
          if (row) {
            for (const perm of permissions) {
              if (perm in row) next[role][perm] = Boolean(row[perm])
            }
          }
        }
        setMatrix(next)
        setBaseline(next)
      })
      .catch(() => { if (!cancelled) toast({ title: 'Could not load permissions', variant: 'error' }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedWedding, toast])

  const hasChanges = baseline !== null && roles.some(role =>
    permissions.some(perm => matrix[role][perm] !== baseline[role][perm])
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
    if (!selectedWedding || !baseline) return
    setSaving(true)
    try {
      for (const role of apiRoles) {
        const changed: Record<string, boolean> = {}
        let dirty = false
        for (const perm of permissions) {
          if (matrix[role][perm] !== baseline[role][perm]) {
            changed[perm] = matrix[role][perm]
            dirty = true
          }
        }
        if (dirty) {
          await apiFetch(`/api/v1/weddings/${selectedWedding}/permissions/`, {
            method: 'PUT',
            body: JSON.stringify({ wedding_id: selectedWedding, role, permissions: changed }),
          })
        }
      }
      setBaseline(matrix)
      toast({ title: 'Permissions updated', description: 'Role permissions have been updated successfully.', variant: 'success' })
    } catch {
      toast({ title: 'Permissions update failed', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedWedding) return
    try {
      const res = await apiFetch<{ defaults: Partial<Record<Role, Record<Permission, boolean>>> }>(
        `/api/v1/weddings/${selectedWedding}/permissions/defaults`
      )
      const next = fullMatrix()
      for (const role of apiRoles) {
        const row = res.defaults?.[role]
        if (row) {
          for (const perm of permissions) {
            if (perm in row) next[role][perm] = Boolean(row[perm])
          }
        }
      }
      setMatrix(next)
      setBaseline(next)
      toast({ title: 'Permissions restored to defaults', variant: 'success' })
    } catch {
      toast({ title: 'Could not load defaults', variant: 'error' })
    }
  }

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Permissions' }]} />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Permissions</h1>
              <p className="mt-1 text-sm text-muted">Manage role-based access control for the platform</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-64">
                <Select
                  label="Wedding"
                  options={weddings.map(w => ({ label: w.weddingName, value: w.id }))}
                  value={selectedWedding}
                  onChange={(e) => setSelectedWedding(e.target.value)}
                  disabled={loading}
                />
              </div>
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
                        className={cn(
                          'border-b border-border/50 transition-colors hover:bg-white/5',
                          role === 'admin' && 'opacity-60'
                        )}
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
                                  disabled={role === 'admin'}
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