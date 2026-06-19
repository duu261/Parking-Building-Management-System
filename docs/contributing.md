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

# Backend
cd backend
mvnd spring-boot:run        # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173, proxies /api -> :5000
```

## Available Commands

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `mvnd spring-boot:run` | Start dev server on port 5000 |
| `mvnd test` | Run test suite |
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
