'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createInitialConfig, mergeConfig } from './shared'
import type { HomeConfig } from './types'
import { clampNoise } from './shared'
import { buildResponsiveCss } from './responsive'

type ConfigSource = 'published' | 'draft'

export interface HomeConfigContextValue {
  config: HomeConfig
  ready: boolean
  reload: () => Promise<void>
  setConfig: (config: HomeConfig) => void
}

const HomeConfigContext = createContext<HomeConfigContextValue | null>(null)

function isHexColor(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export function applyGlobalStyle(config: HomeConfig) {
  const { background, noise } = config?.global ?? { background: '#eae1d2', noise: 25 }
  const root = document.documentElement
  root.style.setProperty('--home-bg', isHexColor(background) ? background : '#eae1d2')
  root.style.setProperty('--home-noise', String(clampNoise(noise) / 100))
}

export function HomeConfigProvider({
  children,
  source = 'published',
  initialConfig,
  external = false,
}: {
  children: ReactNode
  source?: ConfigSource
  initialConfig?: HomeConfig
  external?: boolean
}) {
  const [config, setConfig] = useState<HomeConfig>(() =>
    mergeConfig(createInitialConfig(), initialConfig)
  )
  const [ready, setReady] = useState(external)

  const reload = useCallback(async () => {
    if (external) return
    try {
      const res = await fetch(`/api/home-config?status=${source}`, { cache: 'no-store' })
      if (!res.ok) return
      const data: unknown = await res.json()
      setConfig((prev) => mergeConfig(prev, data))
    } finally {
      setReady(true)
    }
  }, [external, source])

  useEffect(() => {
    if (!ready) void reload()
  }, [ready, reload])

  useEffect(() => {
    applyGlobalStyle(config)
  }, [config])

  const applyConfig = useCallback((next: HomeConfig) => {
    setConfig((prev) => mergeConfig(prev, next))
  }, [])

  return (
    <HomeConfigContext.Provider
      value={{ config, ready, reload, setConfig: applyConfig }}
    >
      <style id="tj-home-responsive" dangerouslySetInnerHTML={{ __html: buildResponsiveCss(config) }} />
      {children}
    </HomeConfigContext.Provider>
  )
}

export function useHomeConfig(): HomeConfigContextValue {
  const ctx = useContext(HomeConfigContext)
  if (!ctx) throw new Error('useHomeConfig must be used inside <HomeConfigProvider>')
  return ctx
}

export { mergeConfig }
export type { HomeConfig }