import type { QuotationAddOn, QuotationAddOnLine } from './api-quotation'

/**
 * Client-side pricing preview. The backend ALWAYS recalculates on Generate —
 * these helpers only keep the wizard's live totals in sync with the same
 * config data (never hardcoded prices).
 */

/** Default per-day quantity: Wedding = 2 days, Engagement = 1 day. */
export function defaultQty(eventType: string): number {
  return eventType === 'wedding' ? 2 : 1
}

export function computeAddOnLines(
  addOns: QuotationAddOn[],
  selections: Record<string, number>,
): QuotationAddOnLine[] {
  const lines: QuotationAddOnLine[] = []
  for (const addOn of addOns) {
    const selected = selections[addOn.id]
    if (!selected) continue
    const qty = addOn.perDay ? selected : 1
    lines.push({
      id: addOn.id,
      name: addOn.name,
      price: addOn.price,
      perDay: addOn.perDay,
      qty,
      lineTotal: addOn.perDay ? addOn.price * qty : addOn.price,
    })
  }
  return lines
}

export function computeTotals(packagePrice: number, lines: QuotationAddOnLine[]) {
  const addOnTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  return {
    basePrice: packagePrice,
    addOnTotal,
    total: packagePrice + addOnTotal,
  }
}

export function formatINR(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`
}
