# Project Status — TJ Photography AI Wedding Gallery

> **Last updated:** 25 Sep 2026

## Overall Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Luxury brand landing page (frozen) |
| Phase 2 | ✅ Complete | Backend API — 85 routes, PostgreSQL |
| Phase 3 | 🔄 In Progress | Gallery feature build (Kwikpic-style) |
| Phase 4 | 📅 Planned | AI Face Search (InsightFace) |
| Phase 5 | 📅 Planned | Production Polish |

## Phase 1 — Completed Sections (Frontend, Frozen)

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Data Layer | ✅ | 7 data files, strict types |
| 2 | Navbar | ✅ | Transparent → blur scroll, mobile menu |
| 3 | Hero | ✅ | Cinematic full-screen, 2 CTAs |
| 4 | Why Choose Us | ✅ | 6 service cards |
| 5 | Featured Stories | ✅ | 3 editorial layouts |
| 6 | Masonry Portfolio | ✅ | CSS columns, lazy load |
| 7 | Statistics | ✅ | Animated counters |
| 8 | Timeline | ✅ | 6-step vertical |
| 9 | Find Your Wedding | ✅ | Glass card, 4 login methods |
| 10 | Testimonials | ✅ | Auto-rotating carousel |
| 11 | Instagram Feed | ✅ | 8-photo grid |
| 12 | CTA Section | ✅ | Book Your Wedding |
| 13 | Footer | ✅ | 4-column premium |

## Phase 1 Add-ons (later sessions)

- **About page variant system** — COMPLETE: 5 sections (Hero, Quotes, Founders,
  Approach, Team) × 3 designs (A/B/C) with `‹ ›` arrows + dots.
  - Content shared across variants; images switch per variant (Hero `imageB/imageC`,
    Founders `groupImageB/groupImageC`).
  - Public = localStorage override > config variant; editor/preview = config-driven.
  - Editor: DesignPicker + variant-bound media fields in `about-panel.tsx`.
  - Files: `frontend/src/components/about/*`, `frontend/src/app/about/page.tsx`,
    `frontend/src/lib/home-config/{preview-bridge,editor,types}.ts(x)`.

## Phase 3 — Gallery Build (current focus)

### Done & Verified (25 Sep 2026)

* **Photo detail modal** — working Share (Web Share → clipboard fallback) + Delete
  (confirm → closes modal); Download button hides when `download_enabled=false`.
* **Gallery context menu** — "Enable/Disable Download" toggle →
  `POST /api/v1/photos/batch/update`, instant UI update.
* **Gallery-level download enforcement (backend)** — `settings.gallery.download_enabled`
  OFF blocks roles `client/guest/editor` on: single download, batch download, ZIP,
  `media/photos/{id}/content`, share media/ZIP. `photographer`/`admin` always allowed.
* **Settings enforcement**
  * `group.hide_deleted` — share listing, album counts, media content honor it.
  * `group.welcome_message` / `name` / `icon_url` — exposed in `ShareGalleryResponse`
    + `WeddingResponse`, rendered in guest gallery header.
  * `gallery.pin_protection` + `gallery.pin_code` — now actually settable from
    Settings → Gallery (PIN input) and enforced on `POST /downloads`.
* **Share modal now uses the real API** (`share-link-modal.tsx`)
  * Generate → `POST /weddings/{id}/share-links` (was 100% client-side fake).
  * List → `GET /weddings/{id}/share-links` (old URL 404'd silently).
  * Delete button, Copy, expiry/access-count/PIN badge.
  * Optional 4–6 digit PIN field → `pin_code`.
  * URL = backend `/s/{code}` + real origin (hardcoded domain removed).
* **Security fix** — public `GET /share-links/{code}` and `GET /share/{code}` no
  longer echo `pin_code` (was readable by anyone holding the link).
  Regression test: `tests/test_share_security.py::test_share_link_pin_gate_and_no_pin_leak`.
* **Critical bug fixes found during verification**
  1. Photo upload was 100% broken — `upload_service` called a non-existent
     `PhotoRepository.create_from_upload` (+ 2 follow-on crashes). Now uses
     `PhotoService.create_from_upload` with a single counter-increment path.
  2. Face auto-registration silently failed on every upload
     (`PhotoRepository.get_storage()` does not exist). Fixed.

### Verification Status

* Backend: **171/171 tests pass** (`venv\Scripts\python.exe -m pytest tests -q`)
* Frontend: `npx tsc --noEmit` OK, `npx eslint ... --max-warnings=0` → 0 errors
* Dev server: `http://localhost:3008` → HTTP 200

### Pending / Not Started (by agreement)

* **Guest Upload** — excluded from the TJ deal ("sirf TJ photography upload karega");
  therefore `group.uploads_enabled` has nothing to enforce yet.
* Real SMS OTP provider — frontend has demo bypass for dev
  (`client-login-modal.tsx`, `use-auth.tsx` DEV_AUTH).
* Selfie / liveness detection, InsightFace (joins later).
* "Baad Mein" 16-item list — see README.
* Mock API allowlist in `frontend/src/lib/api.ts` still lists the old
  `/api/v1/share-links` path (only matters when `NEXT_PUBLIC_MOCK_API=true`).

## Architecture Decisions

- All homepage/about content in `frontend/src/data/` — zero component changes to edit text/images
- Storage abstraction layer — local fs ↔ S3/R2 ready
- Mobile-first responsive design
- No loading screen (deferred to Phase 5); AI references off homepage (Phase 4)
- Frameworks: Next.js 16, Tailwind v4, Framer Motion, React 19

## Running Locally

### Frontend
```powershell
cd frontend
npm run dev
# → http://localhost:3008
```

### Backend
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
# → http://localhost:8001 (per frontend/.env.local NEXT_PUBLIC_API_URL)
```

### Tests
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests -q
```

## Suggestions for Future

1. **Replace placeholder images** with actual wedding photos in `frontend/src/data/`
2. **Add loading transitions** between sections (Phase 5)
3. **Wire mock-API share-links path** or drop it from `api.ts` allowlist
4. **Add Vitest** for frontend testing
