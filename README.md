# ParkMaster — Parking Building Management System

FPT University SWP391 capstone. A full-stack parking building management
system with role-based access, AI slot allocation, online payments, and
real-time analytics.

**Live demo:** Frontend — [parkmaster.vercel.app](https://parking-building-management-system.vercel.app) · Backend API — hosted on [Render](https://render.com)

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Spring Boot 3.3, Spring Data JPA, Spring Security (JWT), Flyway |
| Database | PostgreSQL (Neon in production) |
| Deploy | Vercel (frontend) + Render (backend) + Neon (Postgres) |

## Roles

| Role | Access |
|------|--------|
| `ADMIN` | User management, roles, system config |
| `MANAGER` | Building/floor/slot CRUD, pricing, reports, analytics |
| `STAFF` | Check-in, check-out, payment settlement, exception handling |
| `USER` (Driver) | Reserve, track sessions, pay, feedback, monthly passes |
| Guest (no auth) | Public overview, pricing, slot availability |

## Features

- Building / floor / slot management with vehicle-type segmentation
- Vehicle types and pricing policies with peak-hour multiplier
- Parking sessions (check-in / check-out) and charge calculation (grace period + daily cap)
- Payments (CASH / ONLINE / VNPay) and manager revenue reporting
- Reservations — pre-book a slot, auto-allocated and held, staff convert at the gate
- **AI slot allocation** — scores slots by load balance, vehicle-type match, distance, and peak hour
- Exception reports — lost ticket, wrong plate, overtime, wrong zone
- Monthly passes — driver self-purchase via VNPay, free exit while active
- VNPay online payment — sandbox-integrated (API v2.1.0, HMAC-signed, IPN callback)
- Driver feedback — 1–5 star rating per completed session
- AI chat assistant — hybrid (local FAQ always on, Google Gemini when keyed)

See [`docs/features/`](docs/features/) for detailed per-feature notes.

## Quick Start

### Prerequisites

- JDK 21+ (JDK 23 works)
- Maven or `mvnd` (`mvn` is aliased to `mvnd`)
- Node.js 18+
- Docker (for local PostgreSQL)

### 1. Start database

```bash
docker compose up -d
```

### 2. Backend (port 5000)

```bash
cd backend
mvnd spring-boot:run -Dspring-boot.run.profiles=dev
```

The `dev` profile activates Flyway migrations and runs the **data seeder** on first start,
populating 2 buildings, 6 floors, 86 slots, demo accounts, sessions, payments, and more.
See [demo accounts](docs/demo-accounts.md) for login credentials.

> **Re-seeding:** The seeder only runs on an empty database. To re-seed, drop and recreate
> the database: `docker compose down -v && docker compose up -d`, then restart the backend.

### 3. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev              # proxies /api -> localhost:5000
```

### AI assistant key (optional)

The chat assistant works with no config (local FAQ). To enable Google Gemini answers,
get a free key at <https://aistudio.google.com/apikey>, then:

```bash
cd backend
cp .env.example .env      # edit .env: GEMINI_API_KEY=...
./run-local.sh            # loads .env and starts the backend (dev profile)
```

`.env` is gitignored. On Render, set `GEMINI_API_KEY` (and optional `GEMINI_MODEL`,
default `gemini-2.5-flash`) as service env vars.

## API Groups

`/api/auth` · `/api/admin` · `/api/manager` · `/api/staff` · `/api/driver` · `/api/public`

Full API reference: [`docs/api-docs.md`](docs/api-docs.md)

## Testing

```bash
cd backend
mvnd test                # 101 tests — JUnit 5 + Mockito
```

## Deployment

Two-branch workflow: `main` (development) → `deploy` (production).

```bash
git checkout deploy && git merge main && git push origin deploy
```

Render and Vercel auto-redeploy on push to `deploy`. UptimeRobot pings
`/api/public/health` every 14 min to prevent Render cold starts.

See [`docs/env.md`](docs/env.md) for environment variables.

## Documentation

| Document | Description |
|---|---|
| [SRS](docs/srs.md) | Software Requirements Specification |
| [Use Cases](docs/use-cases.md) | 17 use cases, all 5 actors |
| [User Flows](docs/user-flows.md) | Step-by-step UI flows per role |
| [ERD](docs/erd.md) | Entity-Relationship Diagram — 12 entities, 9 enums |
| [Architecture](docs/architecture.md) | Layered design, package layout, security, data flow |
| [API Docs](docs/api-docs.md) | REST API reference — 50+ endpoints |
| [Test Plan](docs/test-plan.md) | Test strategy and manual scenarios |
| [Contributing](docs/contributing.md) | Setup, conventions, and dev workflow |
| [Demo Accounts](docs/demo-accounts.md) | Test accounts and seeded data |
| [Environment](docs/env.md) | Environment variables |
| [Integrations](docs/integrations.md) | VNPay, Gemini AI, UptimeRobot |

### Feature Notes

Slide-ready summaries in [`docs/features/`](docs/features/) for instructor presentations:

AI Slot Allocation · Monthly Pass · Parking Session · Payment · Reservation ·
Vehicle Type & Pricing · VNPay Payment · AI Assistant · Exception Report · Feedback
