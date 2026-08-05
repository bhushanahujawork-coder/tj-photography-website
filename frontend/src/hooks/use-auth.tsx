'use client'

import { createContext, useContext, useCallback, useMemo, useState, useEffect, type ReactNode } from 'react'
import type { User, Session, AuthState, Role, Permission, PermissionSet } from '@/types/platform'
import { DEFAULT_PERMISSIONS } from '@/types/platform'
import { apiFetch } from '@/lib/api'

const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH !== 'false'

interface AuthContextValue extends AuthState {
  loginWithPhone: (phone: string) => Promise<boolean>
  loginWithEmail: (email: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  verifyOTP: (code: string) => Promise<boolean>
  logout: () => void
  hasPermission: (weddingId: string, permission: Permission) => boolean
  hasRole: (roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function storeAuth(token: string, refreshToken: string, expiresAt: string, user: User) {
  try {
    localStorage.setItem('auth', JSON.stringify({ token, refreshToken, expiresAt, user }))
  } catch { }
}

function loadAuth(): { token: string; user: User } | null {
  try {
    const stored = localStorage.getItem('auth')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (!parsed.token || !parsed.user) return null
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem('auth')
      return null
    }
    return { token: parsed.token, user: parsed.user }
  } catch {
    return null
  }
}

function clearAuth() {
  try { localStorage.removeItem('auth') } catch { }
}

async function devLogin(setState: (s: AuthState) => void): Promise<boolean> {
  setState({ user: null, session: null, isLoading: true, isAuthenticated: false })
  try {
    const res = await apiFetch<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'tj@tjphotography.com', password: 'Password123' }),
    })
    const user: User = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      phone: res.user.phone,
      avatarUrl: res.user.avatarUrl,
      role: res.user.role,
      isActive: res.user.isActive ?? true,
      isVerified: res.user.isVerified ?? false,
      createdAt: res.user.createdAt,
      lastLoginAt: res.user.lastLoginAt,
    }
    storeAuth(res.accessToken, res.refreshToken, res.expiresAt, user)
    setState({
      user,
      session: { user, token: res.accessToken, expiresAt: res.expiresAt },
      isLoading: false,
      isAuthenticated: true,
    })
    return true
  } catch (e) {
    console.error('Dev login failed, falling back to mock', e)
    const fallbackUser: User = {
      id: 'usr-1', name: 'TJ', email: 'tj@tjphotography.com',
      role: 'admin', isActive: true, isVerified: true,
      createdAt: new Date().toISOString(),
    }
    const mockToken = 'mock-token-' + Date.now()
    storeAuth(mockToken, mockToken, new Date(Date.now() + 86400000 * 7).toISOString(), fallbackUser)
    setState({
      user: fallbackUser,
      session: { user: fallbackUser, token: mockToken, expiresAt: '' },
      isLoading: false,
      isAuthenticated: true,
    })
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const saved = loadAuth()
    if (saved) {
      setState({
        user: saved.user,
        session: { user: saved.user, token: saved.token, expiresAt: '' },
        isLoading: false,
        isAuthenticated: true,
      })
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const loginWithPhone = useCallback(async (_phone: string) => {
    if (DEV_AUTH) {
      return await devLogin(setState)
    } else {
      setState(prev => ({ ...prev, isLoading: true }))
      await new Promise(r => setTimeout(r, 800))
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [])

  const loginWithEmail = useCallback(async (_email: string) => {
    if (DEV_AUTH) {
      return await devLogin(setState)
    } else {
      setState(prev => ({ ...prev, isLoading: true }))
      await new Promise(r => setTimeout(r, 800))
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (DEV_AUTH) {
      return await devLogin(setState)
    } else {
      setState(prev => ({ ...prev, isLoading: true }))
      await new Promise(r => setTimeout(r, 1000))
      const fallbackUser: User = {
        id: 'usr-1', name: 'TJ', email: 'tj@tjphotography.com',
        role: 'admin', isActive: true, isVerified: false,
        createdAt: new Date().toISOString(),
      }
      setState({
        user: fallbackUser,
        session: { user: fallbackUser, token: 'mock-token', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() },
        isLoading: false,
        isAuthenticated: true,
      })
      return true
    }
  }, [])

  const verifyOTP = useCallback(async (_code: string) => {
    if (DEV_AUTH) {
      return await devLogin(setState)
    }
    await new Promise(r => setTimeout(r, 500))
    const fallbackUser: User = {
      id: 'usr-1', name: 'TJ', email: 'tj@tjphotography.com',
      role: 'admin', isActive: true, isVerified: false,
      createdAt: new Date().toISOString(),
    }
    setState({
      user: fallbackUser,
      session: { user: fallbackUser, token: 'mock-token', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() },
      isLoading: false,
      isAuthenticated: true,
    })
    return true
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setState({ user: null, session: null, isLoading: false, isAuthenticated: false })
  }, [])

  const hasPermission = useCallback((_weddingId: string, permission: Permission): boolean => {
    if (!state.user) return false
    const perms = DEFAULT_PERMISSIONS[state.user.role]
    return perms[permission]
  }, [state.user])

  const hasRole = useCallback((roles: Role[]): boolean => {
    if (!state.user) return false
    return roles.includes(state.user.role)
  }, [state.user])

  const value = useMemo(() => ({
    ...state,
    loginWithPhone,
    loginWithEmail,
    loginWithGoogle,
    verifyOTP,
    logout,
    hasPermission,
    hasRole,
  }), [state, loginWithPhone, loginWithEmail, loginWithGoogle, verifyOTP, logout, hasPermission, hasRole])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
