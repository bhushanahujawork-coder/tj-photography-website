# TJ Photography — AI Wedding Gallery

AI-powered wedding photo gallery management platform.

**Client:** TJ Photography | **Status:** ✅ In Development

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (TypeScript, Tailwind CSS v4) |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL (SQLAlchemy + asyncpg) |
| AI/ML | InsightFace (face detection/recognition) |
| Cache | Redis |
| Storage | Local SSD → Cloudflare R2 ready |
| Auth | JWT + OTP (Twilio) + Google OAuth |

---

## Project Structure

```
frontend/           — Next.js (28 routes, 30 components, 7 data files)
backend/            — FastAPI (14 routers, 15 services, 13 models, 85 API routes)
storage/            — Local file storage
docs/               — Documentation
shared/             — Shared types (future)
```

---

## Deliverables

### Included
- AI Face Recognition + Liveness Detection + PWA
- Web app: Auth, Galleries, Albums, Photos, Upload, Download, Share
- 3 Access Roles, Download On/Off at 3 levels, PIN access
- Auto watermark "TJ Photography", Auto compression (15MB→500KB)
- Custom Wedding URL, Photo Reactions (❤️), Lightbox View
- Album Cover Customization, Guest Uploads, Deleted section

### Not Included
- Native Mobile App, Desktop App, 50 Gallery Templates (5 given)
- WhatsApp Delivery, Photo Proofing, Download Limits

---

## Getting Started (No Docker)

```bash
# Backend
cd backend && python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

Saare context, decisions, checklists, aur mindset ke liye → `AGENTS.md` dekho.

---

# CURRENT CHECKPOINT — September 2026

> **Last updated:** 08 Sep 2026

## Completed & Verified

* Phase 1 — Landing/Home Page: COMPLETE
* Homepage has all 15 sections implemented and working.
* Homepage CMS/Editor implemented with draft → preview → publish workflow.
* Editor safety improvements completed:

  * sharp image processing
  * production admin auth fail-closed
  * dirty-state warning
  * publish confirmation
  * URL validation
  * categorized upload errors
* Phase 2 — Backend API: COMPLETE
* FastAPI backend has 85 API routes and PostgreSQL integration.
* Wedding, albums, folders, photos, uploads, gallery, share links, downloads and deleted-photo flows are implemented.
* Media access/security and download authorization are implemented.
* OTP/JWT guest authentication is implemented.
* Existing Vercel deployment/build compatibility has been audited.
* Public website + Editor architecture has been audited.
* TypeScript/build/lint checks are passing after the latest Editor changes.
* Public Website P0 (client-demo trust/safety cleanup): COMPLETE

  * fake gallery fallback removed; invalid codes show honest Not Found
  * broken empty Films card removed
  * fake About statistics/team/philosophy quotes removed
  * fake testimonial/homepage statistics/featured stories removed
  * fake contact info removed; real Instagram handle added; Jamnagar retained
  * mock API OFF by default (`NEXT_PUBLIC_MOCK_API=true` to enable)
* P0 targeted regression: PASS (homepage, about, films, gallery, mock behavior, TypeScript, lint, production build)
* P1 SEO polish: COMPLETE (favicon, robots.txt, sitemap.xml, page metadata, admin noindex)

## Important Architecture Decision

### Vercel

Vercel is currently for the PUBLIC MARKETING WEBSITE.

Note: Vercel serves ALL frontend routes (`/gallery`, `/s/[code]`, `/login`, `/dashboard`, etc.), but live-data pages need a real backend + `NEXT_PUBLIC_MOCK_API=false`. Marketing pages (`/`, `/about`, `/films`) are fully static and safe as-is.

### Homepage Editor

Homepage Editor is currently LOCAL-ONLY.

Reason:
The current CMS draft/published JSON and uploaded media use filesystem storage. Vercel/serverless filesystem writes are not persistent.

Therefore:

* Do NOT treat Vercel Editor Save/Publish/Upload as persistent.
* Do NOT expose a writable filesystem-based Editor on production Vercel.
* Existing Vercel project/domain must remain unchanged.
* Future live CMS can use external persistence/object storage, but that is NOT current scope.

## Current Public Website Status

### Client-demo priority

The immediate goal is to make the public-facing website completely client-ready.

Current approximate status:

* Homepage: ~85%
* Header/Footer: ~95%
* Local Homepage Editor: ~90%
* Films: ~30% because content is placeholder/incomplete
* About: ~70% because team/content needs real verified information
* Gallery: good with real backend; mock mode is NOT acceptable for an honest client demo
* Overall: ~70% before P0 content cleanup

## Current P0 — NEXT WORK (COMPLETE)

P0 client-demo trust/safety cleanup is DONE and regression PASSED.

## Current P1 — SEO Polish (COMPLETE)

1. Favicon / app icon — `src/app/icon.png` exists (256×256, verified in build)
2. robots.txt — `src/app/robots.ts` (public routes allowed, private/platform/disallowed, sitemap link)
3. sitemap.xml — `src/app/sitemap.ts` (/, /about, /films, /gallery)
4. Page-specific SEO titles/metadata — homepage, about, films, gallery layouts
5. Private-route noindex — `/admin/*` via `admin/layout.tsx`, platform routes via robots disallow
6. Verified: tsc pass, eslint pass, production build pass

## Real Content (pending owner data)

Once the owner provides real business data, populate:

* Films (`frontend/src/data/films.ts`) — real YouTube details
* About (`frontend/src/data/about.ts`) — real team/stats/quotes
* Homepage stories/statistics/testimonials — real weddings & verified numbers

## Current Future Roadmap

After public website/client-demo polish:

1. Connect frontend to real deployed backend.
2. Complete the planned 15-item post-homepage feature roadmap.
3. Continue guest/gallery/settings/features.
4. Later decide on persistent production CMS.
5. AI face search + liveness remains later-stage work.

## Explicitly NOT CURRENT PRIORITY

Do NOT automatically start:

* Favorites
* Reactions
* Face AI
* Selfie Search
* Liveness
* PIN enforcement
* download-level permissions
* SaaS/billing
* native/mobile app
* CMS database migration

These remain scope/backlog items and should only be started when explicitly requested.

## Owner Data Rule

Never invent missing business information.

If real data is required, ask the project owner for:

* YouTube links
* team names/photos
* testimonials
* Instagram handle
* verified statistics
* wedding/story names
* other business claims

Currently blocked on owner data: real YouTube film links, team names/photos, testimonials, Instagram handle, verified statistics, wedding/story names.

## Working Rule

When receiving a new task:

* Continue from this checkpoint.
* Do not restart the project audit unnecessarily.
* Preserve verified working functionality.
* Do not modify frozen architecture without explicit approval.
* Do not start backlog features automatically.
* Report changed files, tests and regressions after implementation.
* If a decision or owner data is required, ask first.
