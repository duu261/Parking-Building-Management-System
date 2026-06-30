# ParkMaster — Parking Building Management System

> FPT University SWP391 capstone project

Full-stack parking management system with AI-powered slot allocation, two-tier reservations (free/paid), VNPay payment integration, and real-time analytics.

**Live demo:** [parkmaster.vercel.app](https://parkmaster.vercel.app) · **Release:** [v1.0](https://github.com/duu261/Parking-Building-Management-System/releases/tag/PM_SU26SWP08-v1.0) · **License:** MIT

Demo accounts — see [docs/demo-accounts.md](docs/demo-accounts.md) (all use password `password123`):
- `admin@parkmaster.dev` · `manager@parkmaster.dev` · `staff@parkmaster.dev` · `driver@parkmaster.dev`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, Flyway |
| Database | PostgreSQL (Neon in production) |
| Payment | VNPay sandbox (API v2.1.0, HMAC-SHA512) |
| AI | Slot allocation algorithm + Google Gemini chat assistant |
| Deploy | Vercel (frontend) + Render (backend) + Neon (Postgres) |

## Roles & Access

| Role | What they do |
|------|-------------|
| **Admin** | User management, role assignment, system config |
| **Manager** | Building/floor/slot CRUD, pricing policies, analytics, passes, revenue reports |
| **Staff** | Gate check-in/out, payment settlement (cash/void), exception reports |
| **Driver** | Reserve slots, track sessions, pay online, feedback, monthly passes |
| **Guest** | Public overview, live availability, pricing, AI chat |

## Key Features

### AI Slot Allocation (RQ2–RQ4)
Scores every available slot on four criteria: vehicle type match (40pts), floor load balance (30pts), distance to entry (20pts), peak-hour bonus (10pts). Full score breakdown visible to users — not a black box.

### Two-Tier Reservations
- **Free** — book a time (up to 3h ahead), AI assigns best slot at check-in. 10% discount on parking.
- **Paid** — pick a specific slot (AI recommendation shown with score breakdown), pay 1hr deposit via VNPay. Slot guaranteed. Deposit credited at checkout.

### VNPay Payment Integration
Real sandbox integration with HMAC-SHA512 signing, IPN callback verification, and idempotent settlement. Handles session charges, reservation deposits, and monthly pass purchases. Smart redirect routing back to the correct page.

### Other
- Parking sessions with QR ticket codes, live cost estimate (backend-computed)
- Charge calculator: grace period, daily cap, peak-hour multiplier, reservation discounts
- Monthly passes with self-purchase via VNPay, free exit while active
- Exception reports: lost ticket, wrong plate, overtime, wrong zone
- Void cascading: void a payment → auto-cancels linked reservation/pass
- AI chat assistant (local FAQ + Google Gemini when configured)
- Driver feedback with 1–5 star ratings
- Manager analytics: revenue charts, check-in patterns, allocation comparison

## Quick Start

### Prerequisites
- JDK 21+ (23 works fine)
- Maven or `mvnd` (aliased as `mvn`)
- Node.js 18+
- Docker (for local PostgreSQL)

### 1. Database
```bash
docker compose up -d
```

### 2. Backend (port 5000)
```bash
cd backend
mvnd spring-boot:run -Dspring-boot.run.profiles=dev
```

The `dev` profile runs Flyway migrations + data seeder on first start: 2 buildings, 6 floors, 86 slots, demo accounts with every demoable state (active sessions, reservations, payments, passes, feedback).

> **Re-seed:** `docker compose down -v && docker compose up -d`, then restart backend.

### 3. Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev       # proxies /api → localhost:5000
```

### AI Chat (optional)
Works without config (local FAQ). For Gemini answers: get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), set `GEMINI_API_KEY` in `backend/.env`.

## API

Six endpoint groups: `/api/auth` · `/api/admin` · `/api/manager` · `/api/staff` · `/api/driver` · `/api/public`

50+ endpoints. Full reference: [docs/api-docs.md](docs/api-docs.md)

## Testing

```bash
cd backend && mvnd test    # 102 tests — JUnit 5 + Mockito
```

## Deployment

Two-branch workflow: `main` (development) → `deploy` (production).

```bash
git checkout deploy && git merge main && git push origin deploy
```

Vercel + Render auto-redeploy on push to `deploy`. UptimeRobot pings `/api/public/health` every 14min to prevent Render cold starts.

Environment variables: [docs/env.md](docs/env.md)

## Documentation

| Document | Description |
|----------|-------------|
| [Use Cases](docs/use-cases.md) | 17 use cases across 5 actors |
| [User Flows](docs/user-flows.md) | Step-by-step UI flows per role |
| [ERD](docs/erd.md) | 13 entities, 10 enums, full field reference |
| [Architecture](docs/architecture.md) | Package layout, security, data flow |
| [API Docs](docs/api-docs.md) | REST API reference (50+ endpoints) |
| [Demo Accounts](docs/demo-accounts.md) | Login credentials + seeded data guide |
| [Contributing](docs/contributing.md) | Setup, conventions, dev workflow |
| [Environment](docs/env.md) | All environment variables |
| [Integrations](docs/integrations.md) | VNPay, Gemini AI, UptimeRobot |
| [SRS](docs/report/SRS.md) | Software Requirement Specification |
| [SDS](docs/report/SDS.md) | Software Design Specification |
| [Final Release](docs/report/Final-Release.md) | Deliverable package, install guide, user manual |

### Feature Notes

Slide-ready summaries for instructor presentations in [`docs/features/`](docs/features/):

AI Slot Allocation · Reservation (Free/Paid) · Parking Session · Payment · VNPay · Monthly Pass · Vehicle Type & Pricing · AI Assistant · Exception Report · Feedback

## Research Questions (SWP391 RBL)

- **RQ1**: How does floor/zone segmentation by vehicle type affect slot utilization?
- **RQ2**: Does AI auto-allocation reduce time-to-park vs free choice?
- **RQ3**: Which allocation criteria matter most: distance, floor, vehicle type, time, fill rate?
- **RQ4**: Can the allocation algorithm improve peak-hour utilization?
