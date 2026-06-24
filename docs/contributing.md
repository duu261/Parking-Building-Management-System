# Contributing

## Prerequisites

- JDK 21+ (JDK 23 works)
- Maven (or `mvnd` — aliased as `mvn`)
- Node.js 18+
- Docker (for local PostgreSQL)

## Setup

```bash
# Start database
docker compose up -d

# Backend (dev profile enables seeder + dev config)
cd backend
mvnd spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173, proxies /api -> :5000
```

### Dev Profile

Always run the backend with `-Dspring-boot.run.profiles=dev` for local development.
The `dev` profile:

- Connects to local PostgreSQL (`localhost:5432/parkmaster`)
- Runs Flyway migrations
- Activates the **data seeder** (`@Profile("dev")`) on first start — populates demo
  buildings, floors, slots, accounts, sessions, payments, passes, feedback, and more

See [demo-accounts.md](demo-accounts.md) for all seeded accounts and data.

### Re-seeding Data

The seeder only runs when the database is empty (checks for existing users).
To reset and re-seed:

```bash
# Drop the database volume and recreate
docker compose down -v
docker compose up -d

# Restart backend — seeder runs automatically on the fresh database
cd backend
mvnd spring-boot:run -Dspring-boot.run.profiles=dev
```

> **Note:** `docker compose down -v` deletes the PostgreSQL data volume. All data is lost.
> This is the intended way to get a clean slate for re-seeding.

## Available Commands

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `mvnd spring-boot:run -Dspring-boot.run.profiles=dev` | Start dev server on port 5000 with seeder |
| `mvnd spring-boot:run` | Start without dev profile (no seeder, uses default config) |
| `mvnd test` | Run test suite (101 tests) |
| `mvnd clean package` | Build production JAR |
| `mvnd flyway:info` | Show migration status |

### Frontend (`cd frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Code Style

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One logical change per commit
- English only in code, comments, API responses

## Testing

- Run `mvnd test` before submitting changes
- Backend uses JUnit 5 + Mockito
- Test behavior, not implementation

## Database Migrations

Schema managed by Flyway. Migrations in `backend/src/main/resources/db/migration/`.
Naming: `V{N}__{description}.sql`. Never edit applied migrations — add new ones.

## Project Structure

```
├── frontend/          React 19 + Vite + Tailwind CSS v4
├── backend/           Spring Boot 3.3 + Maven + JPA + PostgreSQL
├── docs/              Project documentation and feature notes
│   └── features/      Per-feature slide-ready notes
└── docker-compose.yml Local PostgreSQL 16
```
