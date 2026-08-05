const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_API !== 'false'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.token || null
    }
  } catch { }
  return null
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[toCamelCase(key)] = transformKeys(value)
    }
    return result
  }
  return obj
}

export class ApiError extends Error {
  url: string
  status: number
  body: string
  backendMessage: string

  constructor(url: string, status: number, body: string, backendMessage: string) {
    super(backendMessage)
    this.name = 'ApiError'
    this.url = url
    this.status = status
    this.body = body
    this.backendMessage = backendMessage
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (USE_MOCK) {
    const mockResult = await tryMock<T>(path, options.method || 'GET', options.body)
    if (mockResult !== undefined) return mockResult
  }

  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    let backendMessage: string
    try {
      const parsed = JSON.parse(body)
      backendMessage = parsed.error?.message || parsed.detail || parsed.message || res.statusText
    } catch {
      backendMessage = body || res.statusText
    }
    const err = new ApiError(url, res.status, body, backendMessage)
    console.error(`[apiFetch] ${res.status} ${res.statusText} — ${path}`)
    console.error(`  URL:       ${url}`)
    console.error(`  Status:    ${res.status} ${res.statusText}`)
    console.error(`  Message:   ${backendMessage}`)
    console.error(`  Body:      ${body}`)
    console.error(`  Stack:     ${err.stack}`)
    throw err
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json()
  return transformKeys(data) as T
}

async function tryMock<T>(path: string, method: string, body?: unknown): Promise<T | undefined> {
  const allowedPaths = [
    '/api/v1/weddings', '/api/v1/auth', '/api/v1/dashboard/stats',
    '/api/v1/dashboard/analytics', '/api/v1/downloads', '/api/v1/activity',
    '/api/v1/notifications', '/api/v1/users/me', '/api/v1/storage/usage',
    '/api/v1/settings', '/api/v1/share-links',
  ]
  const isAllowed = allowedPaths.some(p => path.startsWith(p)) || /\/api\/v1\/weddings(\/|\?|$)/.test(path)
  if (!isAllowed) return undefined

  const { resolveMock } = await import('@/lib/mock-data')
  const raw = resolveMock(path, method, body)
  if (raw === null || raw === undefined) return undefined
  return transformKeys(raw) as T
}

export function apiFetchWithProgress(
  path: string,
  body: FormData,
  onProgress: (pct: number) => void,
): Promise<Response> {
  const token = getToken()
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${API_BASE}${path}`
    xhr.open('POST', url)

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: { 'content-type': xhr.getResponseHeader('content-type') || '' },
        }))
      } else {
        let backendMessage = `HTTP ${xhr.status}`
        try {
          const parsed = JSON.parse(xhr.responseText)
          backendMessage = parsed.detail || parsed.message || backendMessage
        } catch { }
        const err = new ApiError(url, xhr.status, xhr.responseText, backendMessage)
        console.error(`[apiFetch] ${xhr.status} ${xhr.statusText} — ${path}`)
        console.error(`  URL:       ${url}`)
        console.error(`  Status:    ${xhr.status} ${xhr.statusText}`)
        console.error(`  Message:   ${backendMessage}`)
        console.error(`  Body:      ${xhr.responseText}`)
        console.error(`  Stack:     ${err.stack}`)
        reject(err)
      }
    }

    xhr.onerror = () => {
      const err = new ApiError(url, 0, '', 'Network error')
      console.error(`[apiFetch] Network error — ${path}`)
      console.error(`  URL:       ${url}`)
      console.error(`  Stack:     ${err.stack}`)
      reject(err)
    }
    xhr.onabort = () => {
      const err = new ApiError(url, 0, '', 'Upload cancelled')
      console.error(`[apiFetch] Upload cancelled — ${path}`)
      reject(err)
    }
    xhr.send(body)
  })
}


