# ParkMaster — Parking Building Management System

FPT University SWP391 capstone. A parking building management system with
role-based access, pricing, parking sessions, payments, reservations, and an
AI slot-allocation algorithm.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Spring Boot 3.3, Spring Data JPA, Spring Security (JWT), Flyway |
| Database | PostgreSQL |

## Roles

`ADMIN` · `MANAGER` · `STAFF` · `USER` (Driver) · Guest (public, no auth).

## Features

- Building / floor / slot management with vehicle-type segmentation
- Vehicle types and pricing policies, with a peak-hour multiplier
- Parking sessions (check-in / check-out) and charge calculation
- Payments and manager revenue reporting
- Reservations — pre-book a slot, auto-allocated and held, staff convert at the gate
- AI slot allocation — scores slots by load balance, vehicle-type match, distance, and peak hour
- Exception reports — lost ticket, wrong plate, overtime, wrong zone
- Monthly passes — driver self-purchase via VNPay, free exit while active
- VNPay online payment — sandbox-integrated (API v2.1.0, HMAC-signed, IPN callback)
- Driver feedback — 1–5 star rating per completed session
- AI chat assistant — public hybrid assistant (local FAQ always on, Google Gemini when keyed)

See `docs/features/` for per-feature notes.

## Run

### Backend (port 5000)

```bash
cd backend
mvnd spring-boot:run     # run
mvnd test                # tests
```

Requires JDK 21+ and a PostgreSQL database. A local Postgres is provided via
`docker-compose.yml` at the repo root (`docker compose up -d`).

### AI assistant key (optional)

The chat assistant works with no config (local FAQ). To enable Google Gemini answers,
get a free key at <https://aistudio.google.com/apikey>, then:

```bash
cd backend
cp .env.example .env      # then edit .env: GEMINI_API_KEY=...
./run-local.sh            # loads .env and starts the backend (dev profile)
```

`.env` is gitignored. On Render, set `GEMINI_API_KEY` (and optional `GEMINI_MODEL`,
default `gemini-2.5-flash`) as service env vars instead.

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev              # proxies /api -> localhost:5000
npm run build
```

## API groups

`/api/auth` · `/api/admin` · `/api/manager` · `/api/staff` · `/api/driver` · `/api/public`
