# TJ Photography — AI Wedding Gallery

AI-powered wedding photo gallery management platform.

**Client:** TJ Photography | **Price:** ₹50,000 | **Status:** ✅ In Development

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

## Deliverables (₹50k)

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
