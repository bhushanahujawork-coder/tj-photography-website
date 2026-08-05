# Landing Page Blueprint — TJ Photography

## 1. Section Hierarchy

```
┌─────────────────────────────────────────────────┐
│  LOADING SCREEN (1.5s)                          │
│  - Black background                             │
│  - Gold logo fade-in + pulse                    │
│  - Progress bar (gold)                          │
├─────────────────────────────────────────────────┤
│  HERO SECTION (100vh)                           │
│  ├─ Decorative top gold line (1px, 80% width)   │
│  ├─ Logo (serif, gold, ~48px)                   │
│  ├─ Tagline (white, light weight, ~18px)        │
│  ├─ Wedding Code Input Row                      │
│  │   ├─ Input: dark card, gold focus, icon       │
│  │   └─ Button: gold bg, black text, arrow       │
│  ├─ Face Search CTA (below input, muted)         │
│  └─ Admin Login (bottom-right, absolute)         │
├─────────────────────────────────────────────────┤
│  BRAND STRIP (80px)                             │
│  - "Timeless • Elegant • Unforgettable"         │
│  - Gold dots between words                      │
│  - Horizontal scroll or static centered          │
├─────────────────────────────────────────────────┤
│  FEATURES / SERVICES SECTION (optional Phase1)  │
│  - 3-card row: Wedding, Portrait, Event          │
│  - Gold borders, hover lift effect              │
├─────────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                         │
│  - Enter Code → Find Photos → Download           │
│  - Numbered circles with gold outline            │
├─────────────────────────────────────────────────┤
│  TESTIMONIALS (carousel, 2-3 quotes)            │
│  - White text, gold quote marks                  │
│  - Fade transitions                              │
├─────────────────────────────────────────────────┤
│  FOOTER                                          │
│  - Gold divider line                             │
│  - Logo (small)                                  │
│  - Copyright © {year} TJ Photography            │
│  - Social links (placeholder, muted)             │
│  - "All rights reserved"                         │
└─────────────────────────────────────────────────┘
```

## 2. UX Flow

```
[User lands on page]
        │
        ▼
[Loading animation — 1.5s]
  - Logo fade-in, gold shimmer
  - Exit animation → hero fade-up
        │
        ▼
[Hero visible — staggered entrance]
  1. Gold top line (slide from center)
  2. Logo (fade + slide up)
  3. Tagline (fade + slide up, 0.2s delay)
  4. Input + Button (fade + slide up, 0.4s delay)
  5. Admin Login (fade in, 0.8s delay)
        │
        ▼
[User enters wedding code]
  - Input: dark glass-morphism card
  - Gold focus ring glow animation
  - Placeholder text slides up on focus
  - Character limit: 8-12 alphanumeric
        │
        ▼
[User clicks "Find My Photos"]
  - Button hover: scale(1.02), gold glow
  - Click: loading spinner replaces text
  - (Future: POST /api/v1/gallery/lookup)
        │
        ▼
[User clicks "Admin Login"]
  - Small link at bottom-right
  - Hover: gold underline
  - Navigates to /admin (Phase 2)
```

## 3. Desktop Layout

```
┌──────────────────────────────────────────────────────┐
│                    ← 80% max-width →                  │
│                                                        │
│                                                        │
│                     ✦ Gold Line ✦                      │
│                                                        │
│                    TJ PHOTOGRAPHY                      │
│              Every love story deserves                 │
│                  to be remembered                      │
│                                                        │
│        ┌──────────────────┐  ┌──────────┐             │
│        │ Enter wedding code│  │ Find My  │             │
│        └──────────────────┘  │ Photos → │             │
│                              └──────────┘             │
│                                                        │
│          Or search by face — Find with AI              │
│                                                        │
│                                        Admin Login     │
│                                                        │
│                                                        │
│                                                        │
│              ────────  Divider  ────────               │
│                                                        │
│    Timeless  ✦  Elegant  ✦  Unforgettable             │
│                                                        │
│              ────────  Divider  ────────               │
│                                                        │
│                                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Wedding  │    │ Portrait │    │  Event   │         │
│  │ Shooting │    │ Sessions │    │ Coverage │         │
│  └──────────┘    └──────────┘    └──────────┘         │
│                                                        │
│              ────────  Divider  ────────               │
│                                                        │
│       ① Enter Code   ② Find Photos   ③ Download       │
│                                                        │
│              ────────  Divider  ────────               │
│                                                        │
│  "Absolutely breathtaking. Captured our              │
│   special day perfectly." — Sarah & Michael           │
│                                                        │
│              ────────  Divider  ────────               │
│                                                        │
│  TJ Photography            © 2026 All rights reserved  │
└──────────────────────────────────────────────────────┘
```

## 4. Mobile Layout

```
┌──────────────────────┐
│                      │
│       Gold Line      │
│                      │
│    TJ PHOTOGRAPHY    │
│                      │
│  Every love story    │
│      deserves        │
│   to be remembered   │
│                      │
│ ┌──────────────────┐ │
│ │Wedding Code      │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ Find My Photos → │ │
│ └──────────────────┘ │
│                      │
│ Search by face with  │
│         AI           │
│                      │
│           Admin Login│
│                      │
│   ─── Divider ───    │
│                      │
│  Timeless ✦ Elegant  │
│    ✦ Unforgettable   │
│                      │
│   ─── Divider ───    │
│                      │
│  ┌────────────────┐  │
│  │  Wedding       │  │
│  ├────────────────┤  │
│  │  Portrait      │  │
│  ├────────────────┤  │
│  │  Event         │  │
│  └────────────────┘  │
│                      │
│   ─── Divider ───    │
│                      │
│ ① ② ③ (horizontal) │
│                      │
│   ─── Divider ───    │
│                      │
│  "Quote..."          │
│                      │
│   ─── Divider ───    │
│                      │
│  TJ Photography      │
│  © 2026 All rights   │
│  reserved            │
└──────────────────────┘
```

## 5. Component Tree

```
<RootLayout>
  └── <HomePage />                    (client component — needs framer-motion)
        ├── <LoadingScreen />         (1.5s intro, auto-dismiss)
        ├── <HeroSection />           (100vh, centered flex)
        │     ├── <DecorativeLine />   (gold horizontal rule, animated)
        │     ├── <Logo />             (text-based, serif, gold)
        │     ├── <Tagline />          (white/60, elegant)
        │     ├── <WeddingCodeInput /> (input + button group)
        │     │     ├── <CodeInput />  (styled input)
        │     │     └── <FindButton /> (gold CTA)
        │     ├── <FaceSearchCTA />    (muted link, future feature)
        │     └── <AdminLogin />       (small link, bottom-right)
        ├── <BrandStrip />            (brand values bar)
        ├── <ServicesSection />        (3 service cards)
        ├── <HowItWorks />            (3-step numbered guide)
        ├── <Testimonials />          (quote carousel)
        └── <Footer />                (copyright, links)
```

## 6. Animation Plan

| Element | Type | Duration | Delay | Easing |
|---------|------|----------|-------|--------|
| Loading screen logo | fade-in + pulse | 1.5s | 0s | ease-out |
| Loading screen exit | opacity → 0 | 0.5s | 1.5s | ease-in |
| Gold decorative line | scaleX 0→1 (from center) | 1.2s | 0.2s | ease-out |
| Logo | y: 40→0, opacity 0→1 | 0.8s | 0.4s | [0.22, 1, 0.36, 1] |
| Tagline | y: 30→0, opacity 0→1 | 0.8s | 0.6s | [0.22, 1, 0.36, 1] |
| Input group | y: 30→0, opacity 0→1 | 0.8s | 0.8s | [0.22, 1, 0.36, 1] |
| FaceSearch CTA | y: 20→0, opacity 0→1 | 0.6s | 1.0s | ease-out |
| Admin Login | opacity 0→1 | 0.5s | 1.4s | ease-out |
| Brand strip items | stagger fade-up | 0.5s each | viewport | ease-out |
| Service cards | stagger fade-up | 0.6s each | viewport | ease-out |
| How-it-works steps | stagger slide-left | 0.5s each | viewport | ease-out |
| Testimonials | cross-fade | 0.8s | 5s interval | ease-in-out |

**Loading Animation Sequence:**
1. Black screen (0s)
2. Logo fades in (0.2–0.8s)
3. Subtle gold shimmer sweep across logo (0.5–1.2s)
4. Entire screen fades to transparent (1.5–2.0s)
5. Hero animations begin (2.0s+)

## 7. Typography System

| Element | Font | Weight | Size (Desktop) | Size (Mobile) | Letter-spacing | Line-height |
|---------|------|--------|---------------|--------------|----------------|-------------|
| Logo | Playfair Display | 700 | 48px | 36px | 0.05em | 1.1 |
| Tagline | Inter | 300 | 20px | 16px | 0.02em | 1.6 |
| Input text | Inter | 400 | 16px | 15px | normal | 1.5 |
| Button text | Inter | 600 | 15px | 14px | 0.03em | 1 |
| Section heading | Playfair Display | 700 | 36px | 28px | 0.02em | 1.2 |
| Card title | Playfair Display | 600 | 22px | 20px | 0.02em | 1.3 |
| Card description | Inter | 300 | 15px | 14px | normal | 1.6 |
| Footer | Inter | 300 | 13px | 12px | 0.02em | 1.5 |
| Step numbers | Playfair Display | 700 | 28px | 24px | normal | 1 |
| Admin Login | Inter | 400 | 12px | 12px | 0.05em | 1 |

## 8. Spacing System

Based on 8px grid:

```
Section padding (desktop):  px-8 md:px-16 lg:px-24
Section padding (mobile):   px-6
Hero inner gap:             gap-8 md:gap-10
Logo to tagline:            mb-4
Tagline to input:           mb-8 md:mb-10
Input to FaceSearch:        mt-6
Admin Login from bottom:    bottom-8 right-8
Cards gap:                  gap-6 md:gap-8
Footer padding:             py-10 md:py-16
Step circles:               w-12 h-12 md:w-16 md:h-16
```

## 9. Color System

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#000000` | Page background |
| `--foreground` | `#FFFFFF` | Primary text |
| `--gold` | `#D4AF37` | Logo, accents, buttons |
| `--gold-light` | `#F0D68A` | Hover states, shimmer |
| `--gold-dark` | `#B8941E` | Active states, borders |
| `--card` | `#111111` | Input background, cards |
| `--muted` | `#888888` | Secondary text |
| `--border` | `#222222` | Subtle borders |
| `--white/60` | `rgba(255,255,255,0.6)` | Tagline, muted text |
| `--white/10` | `rgba(255,255,255,0.1)` | Subtle dividers |

**Gradient Overlays:**
- Hero background: `radial-gradient(ellipse at center, rgba(212,175,55,0.03) 0%, transparent 70%)`
- Button hover: `linear-gradient(135deg, #D4AF37, #F0D68A, #D4AF37)`
- Gold line shimmer: `linear-gradient(90deg, transparent, #D4AF37, transparent)`

## 10. Image Placement

Phase 1 is text-only; images will be added in later phases.

**Future image plan:**
- Hero background: Full-screen wedding photo with dark overlay (70% opacity black, 30% opacity gold gradient)
- Service cards: Small thumbnail placeholders
- Testimonials: Couple photos (small circular)

**Placeholder strategy:**
- Use CSS gradient backgrounds instead of actual images
- Dark gradient with subtle gold tint as hero backdrop
- This keeps Phase 1 self-contained and fast-loading

## 11. Wedding Code Input UX

```
States:
┌─────────────────────────────────────────────────────┐
│ [IDLE]                                               │
│  ┌─────────────────────────────────────────┐        │
│  │  🔗  Enter your wedding code           │        │
│  └─────────────────────────────────────────┘        │
│                                         [Find →]    │
│                                                     │
│ [FOCUSED]                                            │
│  ┌─────────────────────────────────────────┐        │
│  │  🔗  TJ-2026-A7X9                      │ ← gold │
│  └─── glow ring ───────────────────────────┘  glow  │
│                                         [Find →]    │
│                                                     │
│ [LOADING]                                            │
│  ┌─────────────────────────────────────────┐        │
│  │  🔗  TJ-2026-A7X9                      │        │
│  └─────────────────────────────────────────┘        │
│                                         [⏳]       │
│                                                     │
│ [ERROR]                                              │
│  ┌─────────────────────────────────────────┐        │
│  │  🔗  TJ-2026-A7X9            ── red    │        │
│  └─────────────────────────────────────────┘        │
│  ⚠ Invalid code. Please try again.                  │
│                                         [Find →]    │
└─────────────────────────────────────────────────────┘

Behavior:
- Auto-uppercase as user types
- Max 12 characters
- No special characters except hyphens
- Submit on Enter key
- Input mask: XXX-XXXX-XXXX (optional format hint)
- Gold glow on focus (box-shadow)
- Error state: red border, error message below
- Loading state: button shows spinner, disabled
```

## 12. Face Search CTA Placement

Positioned directly below the wedding code input, separated by `mt-6`.

```
                    [Find My Photos →]

     ─── or ───

    🔍 Search by face with AI
    (Hover: gold underline)
```

Design:
- Small text (14px), `text-muted` color
- Gold underline on hover
- Camera icon or face icon before text
- No button — just a text link
- Future: navigates to face search page

## 13. Admin Login Placement

- Position: `fixed` bottom-right corner
- Size: 12px, uppercase, letter-spaced
- Color: `#555555` (very muted), gold on hover
- No background, no border
- Click: navigates to `/admin`

```
                                        ADMIN LOGIN
```

Ensuring it doesn't interfere with the hero content:
- Uses `pointer-events-auto` on the anchor only
- Wrapped in a `absolute inset-0 pointer-events-none` container so clicks pass through to the background
- Only the anchor itself is clickable

## 14. SEO Structure

```html
<html lang="en">
<head>
  <title>TJ Photography | Premium Wedding Photography</title>
  <meta name="description" content="Experience the art of timeless wedding photography. Browse your gallery with your unique wedding code." />
  <meta property="og:title" content="TJ Photography | Premium Wedding Photography" />
  <meta property="og:description" content="Browse your wedding gallery with your unique code." />
  <meta property="og:type" content="website" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" href="/favicon.ico" />
</head>
```

- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`
- `h1` for the logo (brand name)
- `h2` for section headings
- `alt` text on all images (future)
- Proper `lang` attribute
- Meta viewport for mobile

## 15. Accessibility

- All interactive elements keyboard-focusable
- Focus visible: gold outline ring (`ring-2 ring-gold`)
- `aria-label` on the wedding code input
- `aria-disabled` on button during loading
- Color contrast: white on black passes AAA
- Gold on black: ratio ~4.5:1 (passes AA for large text)
- Reduced motion: `prefers-reduced-motion` disables framer-motion
- Skip-to-content link (hidden, visible on focus)
- Form submission with `role="form"` and `aria-label`
- Loading state announced via `aria-live="polite"`
- Semantic heading hierarchy (h1 → h2 → h3)

## 16. Performance Optimization

- **Client component isolation:** Only the interactive hero section is `'use client'`; static sections remain server components where possible
- **Framer Motion lazy load:** Use `dynamic(() => import('framer-motion'), { ssr: false })` if needed, though framer-motion v11+ is SSR-safe
- **Font display:** `swap` with `next/font` (preloaded, no layout shift)
- **Loading screen:** CSS-only animation for logo pulse (no JS needed until hero)
- **Image optimization:** No images in Phase 1; gradient backgrounds are CSS-only
- **Code splitting:** Each section can be a separate dynamic import if needed
- **Bundle size:** framer-motion ≈ 35KB gzipped; acceptable for a one-pager
- **No external dependencies** beyond next, react, framer-motion
- **Critical CSS:** Inline above-fold styles (Tailwind handles this)
- **Preconnect:** No external font hosts needed (next/font serves self-hosted)

## Phase 1 Implementation Order

1. ✅ Install framer-motion
2. ✅ Update globals.css (theme colors)
3. ✅ Update layout.tsx (fonts + metadata)
4. 🔲 Write LoadingScreen component
5. 🔲 Write HeroSection component
6. 🔲 Write remaining sections (BrandStrip, Services, HowItWorks, Testimonials, Footer)
7. 🔲 Compose all in page.tsx
8. 🔲 Test responsive breakpoints
9. 🔲 Test animations with reduced-motion
10. 🔲 Verify a11y (keyboard nav, screen reader)
