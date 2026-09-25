import { ApiError } from './api'
import { computeAddOnLines, computeTotals } from './quotation-calc'
import { QUOTE_CONFIG } from '../data/quote-pricing'
import type {
  CreateEnquiryPayload,
  EnquiryAuth,
  OtpSendResponse,
  QuotationConfig,
  QuotationResult,
} from './api-quotation'

const OTP_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 30 * 60 * 1000

let pending: { phone: string; code: string; expiresAt: number } | null = null

function fail(message: string): never {
  throw new ApiError('quote://demo', 400, '', message)
}

function randomToken(): string {
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function demoGetQuotationConfig(): QuotationConfig {
  return QUOTE_CONFIG
}

export function demoSendOtp(phone: string): OtpSendResponse {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pending = { phone, code, expiresAt: Date.now() + OTP_TTL_MS }
  return { message: 'OTP sent successfully', demoOtp: code, expiresInMinutes: 5 }
}

export function demoVerifyOtp(phone: string, otpCode: string): EnquiryAuth {
  if (!pending || pending.phone !== phone) {
    pending = null
    fail('No pending OTP found. Request a new code.')
  }
  if (Date.now() > pending.expiresAt) {
    pending = null
    fail('OTP has expired. Request a new code.')
  }
  if (pending.code !== otpCode) fail('Invalid OTP code')
  pending = null
  return {
    accessToken: `demo.${randomToken()}`,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    phone,
    leadId: `lead-demo-${randomToken().slice(0, 8)}`,
  }
}

export function demoCreateQuotation(
  payload: CreateEnquiryPayload,
  phone: string,
  leadId: string,
): QuotationResult {
  const pkg = (QUOTE_CONFIG.packages[payload.eventType] ?? []).find(
    (p) => p.id === payload.packageId,
  )
  if (!pkg) fail('Selected package is no longer available. Please choose again.')

  const selections: Record<string, number> = {}
  for (const selected of payload.addOns) selections[selected.id] = selected.qty

  const lines = computeAddOnLines(QUOTE_CONFIG.addOns[payload.eventType] ?? [], selections)
  const totals = computeTotals(pkg.price, lines)

  return {
    leadId,
    phone,
    eventType: payload.eventType,
    coupleName: payload.coupleName,
    eventDate: payload.eventDate,
    venues: payload.venues,
    package: pkg,
    addOns: lines,
    basePrice: totals.basePrice,
    addOnTotal: totals.addOnTotal,
    quotationTotal: totals.total,
    status: 'QUOTATION_GENERATED',
    note: QUOTE_CONFIG.quotationNote,
    createdAt: new Date().toISOString(),
  }
}
