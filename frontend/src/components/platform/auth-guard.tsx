'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Role } from '@/types/platform'

interface AuthGuardProps {
  children: React.ReactNode
  roles?: Role[]
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (roles && !hasRole(roles)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <h2 className="font-serif text-xl text-foreground">Access Denied</h2>
        <p className="mt-2 text-sm text-muted">You do not have permission to access this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
