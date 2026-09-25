'use client'

import type { AboutVariant, MediaRef } from '@/lib/home-config/types'
import type { PanelProps } from './panels'
import { Card, Field, InlineAlert, MediaBox, TextArea, TextInput } from './controls'

const DESIGN_LETTERS = ['A', 'B', 'C'] as const

/** A / B / C design switcher for one About section. */
function DesignPicker({
  value,
  onChange,
  label = 'Design',
}: {
  value: AboutVariant
  onChange: (v: AboutVariant) => void
  label?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted">{label}</span>
      <div className="flex items-center gap-1">
        {DESIGN_LETTERS.map((l, i) => (
          <button
            key={l}
            type="button"
            aria-pressed={i === value}
            aria-label={`Design ${l}`}
            onClick={() => onChange(i as AboutVariant)}
            className={`w-7 h-7 rounded border text-[11px] font-semibold transition-colors ${
              i === value
                ? 'border-gold bg-gold/15 text-gold-dark'
                : 'border-black/10 text-muted hover:border-gold/40 hover:text-gold-dark'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}


function MoveBtns({
  onUp,
  onDown,
  onRemove,
  upDisabled,
  downDisabled,
}: {
  onUp?: () => void
  onDown?: () => void
  onRemove?: () => void
  upDisabled?: boolean
  downDisabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        aria-label="Move up"
        disabled={upDisabled}
        onClick={onUp}
        className="w-6 h-6 rounded border border-black/10 text-muted hover:border-gold/40 hover:text-gold-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px] leading-none"
      >
        ↑
      </button>
      <button
        aria-label="Move down"
        disabled={downDisabled}
        onClick={onDown}
        className="w-6 h-6 rounded border border-black/10 text-muted hover:border-gold/40 hover:text-gold-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px] leading-none"
      >
        ↓
      </button>
      {onRemove && (
        <button
          aria-label="Remove"
          onClick={onRemove}
          className="w-6 h-6 rounded border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors text-[11px] leading-none"
        >
          ×
        </button>
      )}
    </div>
  )
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function AboutPanel({ config, set, reset }: PanelProps) {
  const a = config.about

  const setQuote = (i: number, field: 'text' | 'label', value: string) => {
    const next = a.quotes.map((q, qi) => (qi === i ? { ...q, [field]: value } : q))
    set(['about', 'quotes'], next)
  }
  const addQuote = () => set(['about', 'quotes'], [...a.quotes, { text: 'New quote', label: 'Label' }])
  const removeQuote = (i: number) => set(['about', 'quotes'], a.quotes.filter((_, qi) => qi !== i))
  const moveQuote = (i: number, dir: -1 | 1) => set(['about', 'quotes'], moveItem(a.quotes, i, i + dir))

  const setFounder = (i: number, field: 'name' | 'role' | 'bio', value: string) => {
    const next = a.founders.members.map((m, mi) => (mi === i ? { ...m, [field]: value } : m))
    set(['about', 'founders', 'members'], next)
  }
  const moveFounder = (i: number, dir: -1 | 1) =>
    set(['about', 'founders', 'members'], moveItem(a.founders.members, i, i + dir))

  const setPrinciple = (i: number, value: string) => {
    const next = a.approach.principles.map((p, pi) => (pi === i ? value : p))
    set(['about', 'approach', 'principles'], next)
  }
  const addPrinciple = () => set(['about', 'approach', 'principles'], [...a.approach.principles, 'New value'])
  const removePrinciple = (i: number) =>
    set(['about', 'approach', 'principles'], a.approach.principles.filter((_, pi) => pi !== i))

  const setTeam = (i: number, field: 'name' | 'role', value: string) => {
    const next = a.team.members.map((m, mi) => (mi === i ? { ...m, [field]: value } : m))
    set(['about', 'team', 'members'], next)
  }
  const removeTeam = (i: number) => set(['about', 'team', 'members'], a.team.members.filter((_, mi) => mi !== i))
  const addTeam = () =>
    set(['about', 'team', 'members'], [
      ...a.team.members,
      { name: '', role: 'New Role', bio: '', image: '/studio/team-a.svg' },
    ])

  const heroField: 'image' | 'imageB' | 'imageC' =
    a.hero.variant === 1 ? 'imageB' : a.hero.variant === 2 ? 'imageC' : 'image'
  const heroImage: MediaRef = a.hero[heroField]
  const heroLetter = DESIGN_LETTERS[a.hero.variant]

  const foundersField: 'groupImage' | 'groupImageB' | 'groupImageC' =
    a.founders.variant === 1 ? 'groupImageB' : a.founders.variant === 2 ? 'groupImageC' : 'groupImage'
  const foundersImage: MediaRef = a.founders[foundersField]
  const foundersLetter = DESIGN_LETTERS[a.founders.variant]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] leading-relaxed text-foreground/65">
        Editing only changes text and images — layout, animations and design stay untouched. Changes stay in the
        draft until Publish. Each section offers 3 designs (A/B/C); content is shared, photos can differ.
      </p>

      {/* Hero */}
      <Card
        id="about-hero"
        title="Hero"
        hint={`Top banner of the About page — currently design ${heroLetter}`}
        onReset={() => reset(['about', 'hero'])}
      >
        <DesignPicker value={a.hero.variant} onChange={(v) => set(['about', 'hero', 'variant'], v)} />
        <Field label="Title">
          <TextInput value={a.hero.title} onChange={(v) => set(['about', 'hero', 'title'], v)} />
        </Field>
        <Field label="Subtitle">
          <TextInput value={a.hero.subtitle} onChange={(v) => set(['about', 'hero', 'subtitle'], v)} />
        </Field>
        <Field label={`Image alt text · design ${heroLetter}`}>
          <TextInput value={heroImage.alt} onChange={(v) => set(['about', 'hero', heroField, 'alt'], v)} />
        </Field>
        <MediaBox
          large
          label={`Hero image · design ${heroLetter}`}
          kind="about"
          src={heroImage.src}
          recommended="Wide cinematic photo — at least 2400px wide"
          meta={heroImage.meta}
          onReplace={(src, meta) =>
            set(['about', 'hero', heroField], { src, alt: heroImage.alt, uploaded: true, meta })
          }
          onReset={() => reset(['about', 'hero', heroField])}
        />
        <InlineAlert tone="info">Each design keeps its own photo — switch designs above to edit that photo.</InlineAlert>
      </Card>

      {/* Quotes */}
      <Card
        id="about-quotes"
        title={`Quotes (${a.quotes.length})`}
        hint="Quote band / cards under the hero"
        onReset={() => reset(['about', 'quotes'])}
      >
        <DesignPicker value={a.quotesVariant} onChange={(v) => set(['about', 'quotesVariant'], v)} />
        {a.quotes.length === 0 && <InlineAlert tone="info">No quotes — the section will be hidden.</InlineAlert>}
        {a.quotes.map((q, i) => (
          <div key={i} className="rounded-lg border border-black/10 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted pt-1">Quote {i + 1}</span>
              <MoveBtns
                onUp={() => moveQuote(i, -1)}
                onDown={() => moveQuote(i, 1)}
                onRemove={() => removeQuote(i)}
                upDisabled={i === 0}
                downDisabled={i === a.quotes.length - 1}
              />
            </div>
            <TextArea rows={2} value={q.text} onChange={(v) => setQuote(i, 'text', v)} />
            <Field label="Label">
              <TextInput value={q.label} onChange={(v) => setQuote(i, 'label', v)} />
            </Field>
          </div>
        ))}
        <button
          onClick={addQuote}
          className="w-full rounded-lg border border-dashed border-gold/50 text-[11px] uppercase tracking-wider py-2 text-gold-dark hover:bg-gold/10 transition-colors"
        >
          + Add quote
        </button>
      </Card>

      {/* Founders */}
      <Card
        id="about-founders"
        title="Founders"
        hint={`Group photo + names — currently design ${foundersLetter}`}
        onReset={() => reset(['about', 'founders'])}
      >
        <DesignPicker value={a.founders.variant} onChange={(v) => set(['about', 'founders', 'variant'], v)} />
        <Field label="Eyebrow">
          <TextInput value={a.founders.eyebrow} onChange={(v) => set(['about', 'founders', 'eyebrow'], v)} />
        </Field>
        <Field label="Heading">
          <TextInput value={a.founders.heading} onChange={(v) => set(['about', 'founders', 'heading'], v)} />
        </Field>
        <Field label={`Group image alt text · design ${foundersLetter}`}>
          <TextInput
            value={foundersImage.alt}
            onChange={(v) => set(['about', 'founders', foundersField, 'alt'], v)}
          />
        </Field>
        <MediaBox
          large
          label={`Founders group image · design ${foundersLetter}`}
          kind="about"
          src={foundersImage.src}
          recommended="Wide photo with all three people — at least 2400px wide"
          meta={foundersImage.meta}
          onReplace={(src, meta) =>
            set(['about', 'founders', foundersField], {
              src,
              alt: foundersImage.alt,
              uploaded: true,
              meta,
            })
          }
          onReset={() => reset(['about', 'founders', foundersField])}
        />
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted mt-1">Members (left → right)</p>
        {a.founders.members.map((m, i) => (
          <div key={i} className="rounded-lg border border-black/10 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted pt-1">
                {i === 1 ? '★ Center' : i === 0 ? 'Left' : 'Right'}
              </span>
              <MoveBtns
                onUp={() => moveFounder(i, -1)}
                onDown={() => moveFounder(i, 1)}
                upDisabled={i === 0}
                downDisabled={i === a.founders.members.length - 1}
              />
            </div>
            <Field label="Name">
              <TextInput value={m.name} onChange={(v) => setFounder(i, 'name', v)} />
            </Field>
            <Field label="Role">
              <TextInput value={m.role} onChange={(v) => setFounder(i, 'role', v)} />
            </Field>
            <Field label="Bio">
              <TextArea rows={2} value={m.bio} onChange={(v) => setFounder(i, 'bio', v)} />
            </Field>
          </div>
        ))}
        <InlineAlert tone="info">
          Center position is the middle card — keep the owner/founder name in the middle member.
        </InlineAlert>
      </Card>

      {/* Approach */}
      <Card
        id="about-approach"
        title="Our Approach"
        hint="Section between founders and team"
        onReset={() => reset(['about', 'approach'])}
      >
        <DesignPicker value={a.approach.variant} onChange={(v) => set(['about', 'approach', 'variant'], v)} />
        <Field label="Eyebrow">
          <TextInput value={a.approach.eyebrow} onChange={(v) => set(['about', 'approach', 'eyebrow'], v)} />
        </Field>
        <Field label="Heading">
          <TextInput value={a.approach.heading} onChange={(v) => set(['about', 'approach', 'heading'], v)} />
        </Field>
        <Field label="Paragraph">
          <TextArea rows={4} value={a.approach.paragraph} onChange={(v) => set(['about', 'approach', 'paragraph'], v)} />
        </Field>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Principles</p>
        {a.approach.principles.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput value={p} onChange={(v) => setPrinciple(i, v)} />
            <button
              aria-label="Remove principle"
              onClick={() => removePrinciple(i)}
              className="w-6 h-6 shrink-0 rounded border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors text-[11px] leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addPrinciple}
          className="w-full rounded-lg border border-dashed border-gold/50 text-[11px] uppercase tracking-wider py-2 text-gold-dark hover:bg-gold/10 transition-colors"
        >
          + Add principle
        </button>
      </Card>

      {/* Team */}
      <Card
        id="about-team"
        title={`Team (${a.team.members.length})`}
        hint="Bottom grid of portraits"
        onReset={() => reset(['about', 'team'])}
      >
        <DesignPicker value={a.team.variant} onChange={(v) => set(['about', 'team', 'variant'], v)} />
        <Field label="Eyebrow">
          <TextInput value={a.team.eyebrow} onChange={(v) => set(['about', 'team', 'eyebrow'], v)} />
        </Field>
        <Field label="Heading">
          <TextInput value={a.team.heading} onChange={(v) => set(['about', 'team', 'heading'], v)} />
        </Field>
        <Field label="Subtitle">
          <TextArea rows={2} value={a.team.subtitle} onChange={(v) => set(['about', 'team', 'subtitle'], v)} />
        </Field>
        {a.team.members.map((m, i) => (
          <div key={i} className="rounded-lg border border-black/10 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted pt-1">Member {i + 1}</span>
              <button
                aria-label="Remove member"
                onClick={() => removeTeam(i)}
                className="w-6 h-6 rounded border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors text-[11px] leading-none"
              >
                ×
              </button>
            </div>
            <Field label="Name (optional)">
              <TextInput value={m.name} onChange={(v) => setTeam(i, 'name', v)} />
            </Field>
            <Field label="Role">
              <TextInput value={m.role} onChange={(v) => setTeam(i, 'role', v)} />
            </Field>
            <MediaBox
              label="Portrait"
              kind="about"
              src={m.image}
              onReplace={(src, meta) => {
                const next = a.team.members.map((mm, mi) =>
                  mi === i ? { ...mm, image: src, uploaded: true, meta } : mm
                )
                set(['about', 'team', 'members'], next)
              }}
              onReset={() => reset(['about', 'team', 'members'])}
            />
          </div>
        ))}
        <button
          onClick={addTeam}
          className="w-full rounded-lg border border-dashed border-gold/50 text-[11px] uppercase tracking-wider py-2 text-gold-dark hover:bg-gold/10 transition-colors"
        >
          + Add team member
        </button>
      </Card>
    </div>
  )
}
