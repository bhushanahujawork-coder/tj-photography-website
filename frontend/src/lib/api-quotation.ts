import { API_BASE_URL, ApiError, getStoredAuth, setStoredAuth, clearStoredAuth, apiFetch, transformKeys } from './api'
import type { StoredSession } from './api'
import {
  demoCreateQuotation,
  demoGetQuotationConfig,
  demoSendOtp,
  demoVerifyOtp,
} from './quote-demo'

// ---------------------------------------------------------------------------
// Types (camelCase — snake_case API responses are transformed by transformKeys)
// ---------------------------------------------------------------------------

export interface QuotationEventType {
  value: string
  label: string
}

export interface QuotationPackage {
  id: string
  name: string
  price: number
  inclusions: string[]
  inclusionsNote: string
}

export interface QuotationAddOn {
  id: string
  name: string
  price: number
  perDay: boolean
  group: string
}

export interface QuotationConfig {
  eventTypes: QuotationEventType[]
  packages: Record<string, QuotationPackage[]>
  addOns: Record<string, QuotationAddOn[]>
  recommendationRules: unknown[]
  leadStatuses: string[]
  inclusionsNote: string
  quotationNote: string
  currency: string
  minAddOnQty: number
  maxAddOnQty: number
}

export interface OtpSendResponse {
  message: string
  demoOtp: string | null
  expiresInMinutes: number
}

export interface EnquiryAuth {
  accessToken: string
  tokenType: string
  expiresAt: string
  phone: string
  leadId: string
}

export interface AddOnSelection {
  id: string
  qty: number
}

export interface CreateEnquiryPayload {
  eventType: string
  coupleName: string
  eventDate: string
  venues: Record<string, string>
  packageId: string
  addOns: AddOnSelection[]
}

export interface QuotationAddOnLine {
  id: string
  name: string
  price: number
  perDay: boolean
  qty: number
  lineTotal: number
}

export interface QuotationResult {
  leadId: string
  phone: string
  eventType: string
  coupleName: string
  eventDate: string
  venues: Record<string, string>
  package: QuotationPackage
  addOns: QuotationAddOnLine[]
  basePrice: number
  addOnTotal: number
  quotationTotal: number
  status: string
  note: string
  createdAt: string
}

export interface QuotationLead {
  id: string
  phone: string
  phoneVerified: boolean
  eventType?: string | null
  coupleName?: string | null
  eventDate?: string | null
  venues?: Record<string, string> | null
  packageId?: string | null
  packageName?: string | null
  packagePrice?: number | null
  addOns?: QuotationAddOnLine[] | null
  quotationTotal?: number | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface LeadList {
  items: QuotationLead[]
  total: number
}

// ---------------------------------------------------------------------------
// Enquiry session (30-min JWT issued after OTP verification)
// ---------------------------------------------------------------------------

const QUOTE_AUTH_KEY = 'quote-auth'

export function getQuoteSession(): StoredSession | null {
  return getStoredAuth(QUOTE_AUTH_KEY)
}

export function getQuoteToken(): string | null {
  return getQuoteSession()?.token || null
}

export function getQuoteLeadId(): string | null {
  return getQuoteSession()?.user?.id || null
}

export function clearQuoteSession(): void {
  clearStoredAuth(QUOTE_AUTH_KEY)
}

function saveQuoteSession(auth: EnquiryAuth): void {
  setStoredAuth(QUOTE_AUTH_KEY, {
    token: auth.accessToken,
    expiresAt: auth.expiresAt,
    user: { id: auth.leadId, phone: auth.phone },
  })
}

// ---------------------------------------------------------------------------
// Low-level fetch: never attaches the platform/guest token — enquiry endpoints
// only accept the short-lived enquiry JWT.
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 4000

function requestSignal(): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return undefined
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS)
}

async function enquiryFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers,
    signal: options.signal ?? requestSignal(),
  })

  if (!res.ok) {
    const body = await res.text()
    let message = res.statusText
    let code: string | undefined
    try {
      const parsed = JSON.parse(body)
      message = parsed.error?.message || parsed.detail || parsed.message || message
      code = parsed.error?.code || parsed.code
    } catch {
      message = body || message
    }
    throw new ApiError(url, res.status, body, message, code)
  }

  const data = await res.json()
  return transformKeys(data) as T
}

// ---------------------------------------------------------------------------
// Quotation API
// ---------------------------------------------------------------------------

const BACKEND_DOWN_STATUSES = new Set([0, 404, 405, 502, 503, 504])

function backendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) return BACKEND_DOWN_STATUSES.has(err.status)
  if (typeof TypeError !== 'undefined' && err instanceof TypeError) return true
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return err.name === 'TimeoutError' || err.name === 'AbortError'
  }
  return false
}

async function withDemoFallback<T>(request: () => Promise<T>, demo: () => T): Promise<T> {
  try {
    return await request()
  } catch (err) {
    if (!backendUnavailable(err)) throw err
    console.warn('[quote] backend unavailable — falling back to demo mode', err)
    return demo()
  }
}

function isDemoSession(): boolean {
  return getQuoteToken()?.startsWith('demo.') ?? false
}

function demoResult(payload: CreateEnquiryPayload): QuotationResult {
  const session = getQuoteSession()
  return demoCreateQuotation(
    payload,
    session?.user?.phone ?? '',
    session?.user?.id ?? '',
  )
}

export async function getQuotationConfig(): Promise<QuotationConfig> {
  return withDemoFallback(
    () => enquiryFetch<QuotationConfig>('/api/v1/enquiries/config'),
    demoGetQuotationConfig,
  )
}

export async function sendEnquiryOtp(phone: string): Promise<OtpSendResponse> {
  return withDemoFallback(
    () =>
      enquiryFetch<OtpSendResponse>('/api/v1/enquiries/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    () => demoSendOtp(phone),
  )
}

export async function verifyEnquiryOtp(phone: string, otpCode: string): Promise<EnquiryAuth> {
  const auth = await withDemoFallback(
    () =>
      enquiryFetch<EnquiryAuth>('/api/v1/enquiries/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp_code: otpCode }),
      }),
    () => demoVerifyOtp(phone, otpCode),
  )
  saveQuoteSession(auth)
  return auth
}

export async function createQuotation(payload: CreateEnquiryPayload): Promise<QuotationResult> {
  if (isDemoSession()) return demoResult(payload)

  const body = {
    event_type: payload.eventType,
    couple_name: payload.coupleName,
    event_date: payload.eventDate,
    venues: payload.venues,
    package_id: payload.packageId,
    add_ons: payload.addOns.map((a) => ({ id: a.id, qty: a.qty })),
  }
  return withDemoFallback(
    () =>
      enquiryFetch<QuotationResult>('/api/v1/enquiries', {
        method: 'POST',
        body: JSON.stringify(body),
      }, getQuoteToken()),
    () => demoResult(payload),
  )
}

// ---------------------------------------------------------------------------
// Leads (admin/photographer — platform session via apiFetch)
// ---------------------------------------------------------------------------

export async function fetchLeads(params: {
  status?: string
  event?: string
  search?: string
}): Promise<LeadList> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.event) query.set('event', params.event)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return apiFetch<LeadList>(`/api/v1/leads${qs ? `?${qs}` : ''}`)
}

export async function updateLeadStatus(id: string, status: string): Promise<QuotationLead> {
  return apiFetch<QuotationLead>(`/api/v1/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
