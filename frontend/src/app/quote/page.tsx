'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ApiError } from '@/lib/api'
import {
  clearQuoteSession,
  createQuotation,
  getQuotationConfig,
  getQuoteSession,
  type CreateEnquiryPayload,
  type QuotationConfig,
  type QuotationResult,
} from '@/lib/api-quotation'
import { computeAddOnLines, computeTotals } from '@/lib/quotation-calc'
import { Progress } from '@/components/quote/progress'
import { OtpStep } from '@/components/quote/otp-step'
import { EventStep } from '@/components/quote/event-step'
import { DetailsStep, type DetailsValue } from '@/components/quote/details-step'
import { PackageStep } from '@/components/quote/package-step'
import { CustomizeStep } from '@/components/quote/customize-step'
import { QuotationStep } from '@/components/quote/quotation-step'
import { ResultStep } from '@/components/quote/result-step'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

type Step = 'otp' | 'event' | 'details' | 'package' | 'customize' | 'quotation' | 'result'

const PROGRESS_STEPS: { key: Step; label: string }[] = [
  { key: 'otp', label: 'Verify' },
  { key: 'event', label: 'Event' },
  { key: 'details', label: 'Details' },
  { key: 'package', label: 'Package' },
  { key: 'customize', label: 'Customize' },
  { key: 'quotation', label: 'Quotation' },
]

const EMPTY_DETAILS: DetailsValue = { coupleName: '', eventDate: '', day1: '', day2: '', venue: '' }

function sessionValid(): boolean {
  const session = getQuoteSession()
  if (!session?.token) return false
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    clearQuoteSession()
    return false
  }
  return true
}

export default function QuotePage() {
  const [config, setConfig] = useState<QuotationConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('otp')

  const [eventType, setEventType] = useState<string | null>(null)
  const [details, setDetails] = useState<DetailsValue>(EMPTY_DETAILS)
  const [packageId, setPackageId] = useState('')
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [quotation, setQuotation] = useState<QuotationResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const loadConfig = useCallback(
    () =>
      getQuotationConfig()
        .then((c) => {
          setConfig(c)
          return true
        })
        .catch((err: unknown) => {
          setLoadError(
            err instanceof ApiError ? err.backendMessage : 'Could not load pricing. Please refresh.',
          )
          return false
        }),
    [],
  )

  useEffect(() => {
    const hadSession = sessionValid()
    loadConfig().then((ok) => {
      if (ok && hadSession) setStep('event')
    })
  }, [loadConfig])

  const packages = useMemo(
    () => (config && eventType ? config.packages[eventType] ?? [] : []),
    [config, eventType],
  )
  const addOns = useMemo(
    () => (config && eventType ? config.addOns[eventType] ?? [] : []),
    [config, eventType],
  )
  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  )
  const lines = useMemo(
    () => (config ? computeAddOnLines(addOns, selections) : []),
    [config, addOns, selections],
  )
  // Add-on lines grouped by category (Rituals / Photography / Editing)
  const groupedLines = useMemo(() => {
    const groupOf = new Map(addOns.map((a) => [a.id, a.group]))
    const map = new Map<string, typeof lines>()
    for (const line of lines) {
      const group = groupOf.get(line.id) ?? 'Add-ons'
      const list = map.get(group) ?? []
      list.push(line)
      map.set(group, list)
    }
    return Array.from(map, ([group, groupLines]) => ({
      group,
      lines: groupLines,
      subtotal: groupLines.reduce((sum, l) => sum + l.lineTotal, 0),
    }))
  }, [lines, addOns])
  const totals = useMemo(
    () => computeTotals(selectedPackage?.price ?? 0, lines),
    [selectedPackage, lines],
  )

  const handleEventChange = (value: string) => {
    setEventType(value)
    setPackageId('')
    setSelections({})
    setStep('details')
  }

  const handleGenerate = async () => {
    if (!eventType || !selectedPackage) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const payload: CreateEnquiryPayload = {
        eventType,
        coupleName: details.coupleName.trim(),
        eventDate: details.eventDate,
        venues:
          eventType === 'wedding'
            ? { day1: details.day1, day2: details.day2 }
            : { venue: details.venue },
        packageId,
        addOns: Object.entries(selections).map(([id, qty]) => ({ id, qty })),
      }
      const result = await createQuotation(payload)
      setQuotation(result)
      setStep('result')
    } catch (err: unknown) {
      setGenerateError(
        err instanceof ApiError ? err.backendMessage : 'Something went wrong. Please try again.',
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleRestart = () => {
    // Same verified phone → no OTP again (session valid for 30 min).
    setQuotation(null)
    setEventType(null)
    setDetails(EMPTY_DETAILS)
    setPackageId('')
    setSelections({})
    setGenerateError(null)
    setStep('event')
  }

  const handleNewNumber = () => {
    clearQuoteSession()
    setQuotation(null)
    setEventType(null)
    setDetails(EMPTY_DETAILS)
    setPackageId('')
    setSelections({})
    setGenerateError(null)
    setStep('otp')
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoadError(null)
                loadConfig()
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {step !== 'result' && (
        <header className="mb-7">
          <h1 className="font-serif text-2xl leading-tight tracking-wide text-foreground sm:text-3xl">
            Build your quotation
          </h1>
          <p className="mt-1.5 mb-5 text-sm leading-relaxed text-foreground/70">
            Select your event, package and add-ons — get an instant estimate.
          </p>
          <Progress steps={PROGRESS_STEPS} current={step} onJump={(key) => setStep(key as Step)} />
        </header>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {step === 'otp' && (
            <Card>
              <CardContent>
                <OtpStep onVerified={() => setStep('event')} />
              </CardContent>
            </Card>
          )}

          {step === 'event' && (
            <Card>
              <CardContent>
                <EventStep value={eventType} onChange={handleEventChange} />
              </CardContent>
            </Card>
          )}

          {step === 'details' && eventType && (
            <Card>
              <CardContent>
                <DetailsStep
                  eventType={eventType}
                  value={details}
                  onChange={setDetails}
                  onBack={() => setStep('event')}
                  onNext={() => setStep('package')}
                />
              </CardContent>
            </Card>
          )}

          {step === 'package' && (
            <Card>
              <CardContent>
                <PackageStep
                  packages={packages}
                  value={packageId}
                  onChange={setPackageId}
                  onBack={() => setStep('details')}
                  onNext={() => setStep('customize')}
                />
              </CardContent>
            </Card>
          )}

          {step === 'customize' && eventType && (
            <Card>
              <CardContent>
                <CustomizeStep
                  addOns={addOns}
                  selections={selections}
                  onChange={setSelections}
                  minQty={config.minAddOnQty}
                  maxQty={config.maxAddOnQty}
                  defaultQty={eventType === 'wedding' ? 2 : 1}
                  onBack={() => setStep('package')}
                  onNext={() => setStep('quotation')}
                />
              </CardContent>
            </Card>
          )}

          {step === 'quotation' && eventType && (
            <QuotationStep
              eventType={eventType}
              details={details}
              pkg={selectedPackage}
              lines={lines}
              groupedLines={groupedLines}
              totals={totals}
              note={config.quotationNote}
              generating={generating}
              error={generateError}
              onBack={() => setStep('customize')}
              onGenerate={handleGenerate}
              onEditDetails={() => setStep('details')}
              onEditPackage={() => setStep('package')}
              onEditAddOns={() => setStep('customize')}
            />
          )}

          {step === 'result' && quotation && (
            <ResultStep
              quotation={quotation}
              onRestart={handleRestart}
              onNewNumber={handleNewNumber}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
