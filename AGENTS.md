# AGENTS.md — AI Agent Instructions (Session: 27 July 2026)

## Project Overview

TJ Photography AI Wedding Gallery — a production-ready local MVP for managing
AI-enhanced wedding photo galleries.

## Current Phase

**Phase 1 — Complete** (Landing Page — currently working on it)
**Phase 2 — Complete** (Backend API — all 85 routes live)

## Tech Stack

- **Frontend:** Next.js 16 (TypeScript, Tailwind v4) — `./frontend/`
- **Backend:** FastAPI (Python 3.12) — `./backend/`
- **Database:** PostgreSQL (async with SQLAlchemy + asyncpg) — `backend/app/core/database.py`
- **Auth:** JWT access/refresh tokens, OTP, Google OAuth, password hashing (bcrypt)
- **Storage:** Abstraction layer (local fs ↔ S3/R2) — `backend/app/core/storage.py`
- **Image Processing:** Pillow (Original/Medium/Thumbnail, EXIF extraction, blurhash)
- **Testing:** pytest + httpx (async) — `backend/tests/`

## Project Structure

```
frontend/                  — FROZEN — see frontend/AGENTS.md
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   └── home/
│   ├── data/
│   │   └── platform/     — Mock data matching backend API shapes
│   └── types/
backend/                   — ACTIVE
├── app/
│   ├── main.py           — FastAPI app assembly (85 routes, CORS, lifespan)
│   ├── __init__.py
│   ├── core/
│   │   ├── config.py     — Pydantic Settings (env vars)
│   │   ├── database.py   — Async engine, session factory, Base
│   │   ├── security.py   — JWT create/decode, password hash/verify
│   │   ├── errors.py     — AppError hierarchy, exception handler
│   │   ├── logging.py    — Structured JSON logging
│   │   ├── storage.py    — LocalStorage / S3Storage (R2-ready)
│   │   └── dependencies.py — get_current_user, auth guards
│   ├── models/           — 13 SQLAlchemy models
│   │   ├── base.py       — BaseModel, TimestampMixin, enums
│   │   ├── user.py, wedding.py, album.py, folder.py, photo.py
│   │   ├── participant.py, permission.py, activity.py, notification.py
│   │   ├── download.py, share_link.py, session.py, storage_usage.py
│   ├── schemas/          — 16 Pydantic v2 schema modules
│   ├── repositories/     — 13 repositories (generic BaseRepository + per-entity)
│   ├── routers/          — 14 routers (auth, weddings, albums, folders, photos,
│   │                       participants, uploads, downloads, activity,
│   │                       notifications, users, settings, dashboard, permissions)
│   └── services/         — 15 service classes (business logic layer)
├── alembic/
│   ├── env.py            — Async Alembic config
│   └── script.py.mako
├── tests/
│   ├── conftest.py       — Async test DB, fixtures (client, tokens, users)
│   ├── test_health.py
│   ├── test_auth.py
│   └── test_weddings.py
├── scripts/
│   └── seed.py           — Dev seed data matching frontend mock data
├── alembic.ini
├── .env.example
├── requirements.txt
└── venv/
storage/                  — File storage (upload, originals, optimized, etc.)
docs/                     — Documentation & blueprints
shared/                   — Future shared types (frontend + backend)
```

## Conventions

- **Python:** Type hints, pydantic-v2, async where possible.
- **TypeScript:** Strict mode, functional components, App Router.
- **Imports:** `@/*` maps to `./frontend/src/*`.
- **Storage:** Abstraction layer for local ↔ S3-compatible (R2).
- **API:** RESTful, prefixed with `/api/v1/`.
- **Testing:** pytest (backend), Vitest + Testing Library (frontend).
- **Design:** Black/gold (#D4AF37) luxury theme. Playfair Display headings, Inter body.
- **Images:** All sourced from `src/data/` files. No hardcoded paths in components.
- **Animations:** Framer Motion. Elegant only — no excessive effects.
- **Backend startup:** `uvicorn app.main:app --reload` (from `backend/`)
- **Seed data:** `cd backend; python scripts/seed.py`

## Phase 1 — Built Sections (Frontend, Frozen)

All in `src/components/home/`:
- Navbar (transparent → blur on scroll)
- Hero (cinematic, 2 CTAs, no wedding input in hero)
- Why Choose Us (6 service cards)
- Featured Stories (editorial layouts)
- Masonry Portfolio (CSS columns, lazy load)
- Statistics (animated counters)
- Timeline (6-step experience)
- Find Your Wedding (glass card, 4 login methods)
- Testimonials (auto-rotating carousel)
- Instagram Feed (8-photo grid)
- CTA Section (Book Your Wedding)
- Footer (4-column premium minimal)

## Phase 2 — Backend Complete (85 API Routes)

All models, schemas, repositories, services, and routers built and verified:
- **Auth:** register, login (email/otp/google), refresh, logout, password reset, profile
- **Weddings:** CRUD, publish/archive/duplicate, lookup by code
- **Albums/Folders:** nested CRUD under weddings, reorder folders
- **Photos:** CRUD, batch operations (update/delete/move/restore), favorite, EXIF
- **Participants:** invite (single/bulk), manage, accept, resend
- **Uploads:** init multi-file session, complete per-file, progress tracking, cancel
- **Downloads:** request, list records, ZIP generation
- **Share Links:** create/list/delete, lookup by code
- **Activity/Notifications:** list, mark read, unread count
- **Dashboard:** stats, recent activity, analytics
- **Settings:** gallery, downloads, branding, theme
- **Permissions:** matrix, update, defaults

All API response shapes match `frontend/src/data/platform/` mock data exactly.

## Data Files

All editable in `frontend/src/data/`:
- `site.ts` — brand, nav, footer, CTA, social, contact
- `homepage.ts` — section headings, hero config, Instagram
- `services.ts` — Why Choose Us service cards
- `stories.ts` — Featured wedding stories
- `testimonials.ts` — Couple quotes
- `statistics.ts` — Number counters
- `portfolio.ts` — Gallery images
- `platform/` — Backend mock data (10 files: auth, weddings, photos, etc.)

## Session Context (27 July 2026)

### 🧑 Client Deal
- **Client:** TJ Photography (Wedding Photographer in Jamnagar)
- **Price:** ₹50,000 (finalised, deal locked)
- **Referral commitment:** Client will send 4-5 more photographers at ₹75k each
- **Payment terms:** 50% advance, 40% on delivery, 10% on setup

### 🏠 Current Focus
- **Working on:** Home Page (Phase 1 Landing Page)
- **No Docker** — PC slow, using manual setup (PostgreSQL + Redis installed directly)
- **No Mobile App** — excluded from deal

### 📋 Complete Feature Delivery List
See `README.md` for full A-to-Z features. Key highlights:
- ✅ AI Face Recognition (InsightFace)
- ✅ PWA (Add to Home Screen)
- ✅ Liveness Detection
- ✅ Auto Watermark "TJ Photography"
- ✅ Auto Compression (15MB → ~500KB WebP, lossless)
- ✅ 3 Access Roles (Admin/Full/Partial)
- ✅ Download On/Off at 3 levels
- ✅ Custom Wedding URL
- ✅ PIN Gallery Access
- ✅ Photo Reactions (❤️ → favorites)
- ✅ Lightbox View
- ✅ Album Cover Customization
- ✅ Wedding Microsite (future add-on ₹2.5k-4k)
- ✅ Print Store (future add-on)
- ✅ Digital Wedding Card (future add-on)

### 🧠 Mindset & Direction
- **Baat khatam, features clear, deal done** — no more idea generation needed
- "Commission pe koi agree nahi hoga" — so revenue = upfront license + hosting + setup fees
- **Revenue plan:** TJ ₹50k → 4 more photographers at ₹25-30k each → ₹1.5L-1.7L total
- Future revenue: Annual renewals ₹5k/yr, Add-on features alag, Hosting ₹500-1k/mo
- **Kwikpic comparison:** Platform is Kwikpic-level but web-only (no native mobile app, no desktop app)
- **Guest upload:** Excluded from current deal — "sirf TJ photography upload karega"

### 📌 Yaad Rakhne Wali Baatein (READMEd)

**READMEd in README.md — "Baad Mein" section:**
- Before/After Slider
- Couple Dashboard
- Monthly Storage Report
- Email Notifications (online payment needed)
- AI Auto-Sort Albums
- YouTube Link Upload
- Guest Pre-Wedding + Live Upload
- Live Photo Wall
- Same-Day Edit Gallery
- Digital Guest Book
- Photo Contest
- Event Photo Timelines
- Family Group Albums
- Wedding Analytics Report
- Color Grading Presets Sale
- Wedding Hashtag Wall

### 🔔 "After Home Page Work" — Automatic Reminder
When user says "home page complete" or types any form of "baad" → **show the After Home Page Work checklist from README** (15 items):

1. Kwikpic jaisa structure — Group/Wedding → All Photos → Albums → Guest Upload → Deleted/Highlights
2. Photo Detail View — zoom, slide, heart, share, download, delete (only TJ)
3. Guest Flow — link → selfie → OTP → JWT (persistent login)
4. Group Settings — anyone can change Name/Icon, welcome messages, hide deleted, liveness, anonymous
5. Guest Uploads section
6. Deleted section (only TJ dekhe)
7. Highlights section
8. Album Cover Customization by TJ
9. Liveness Detection
10. Anonymous Viewing
11. Custom Wedding URL (slug)
12. PIN Gallery Access
13. Download On/Off at 3 levels (gallery/album/photo)
14. Photo Reactions (❤️) with user tracking
15. Face Profile model for AI recognition

### 🗣️ User Communication Style
- Hindi + English mix (Hinglish)
- Short, impatient — wants direct answers, no fluff
- Say "baad" → means add to Baad Mein list (don't show list)
- Say "baad ki list dikha" or "baad wali list" → show the list
- "ye baad me" → mark as future
- Image input not supported — ask user to describe or give file path
- Call him "bhai"

## Next Steps

1. Complete Home Page (current focus)
2. Then → "After Home Page Work" list from README
3. Set up PostgreSQL, run `alembic upgrade head`, run `python scripts/seed.py`
4. Start backend: `uvicorn app.main:app --reload`
5. Start frontend: `npm run dev`
6. Connect frontend to backend (swap mock data for API calls module by module)
