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

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev              # proxies /api -> localhost:5000
npm run build
```

## API groups

`/api/auth` · `/api/admin` · `/api/manager` · `/api/staff` · `/api/driver` · `/api/public`
