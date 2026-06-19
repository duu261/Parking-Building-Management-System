# Environment Variables

## Backend (`backend/`)

All variables have dev-friendly defaults. Override in production.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_URL` | Yes | `jdbc:postgresql://localhost:5432/parkmaster` | PostgreSQL JDBC connection string |
| `DB_USERNAME` | Yes | `parkmaster` | Database user |
| `DB_PASSWORD` | Yes | `parkmaster` | Database password |
| `PORT` | No | `5000` | HTTP server port (Render injects this) |
| `SERVER_PORT` | No | `5000` | Alias for PORT (local override) |
| `PARKMASTER_JWT_SECRET` | Yes (prod) | dev-only base64 key | 256-bit base64-encoded JWT signing secret |
| `PARKMASTER_JWT_TTL` | No | `120` | Access token TTL in minutes |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | CORS allowed origins (comma-separated) |

## Frontend (`frontend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | (Vite proxy to `localhost:5000`) | Override API base URL for production builds |

## Docker Compose (repo root)

The `docker-compose.yml` provides a local PostgreSQL 16 instance:

```
POSTGRES_DB=parkmaster
POSTGRES_USER=parkmaster
POSTGRES_PASSWORD=parkmaster
```

Start: `docker compose up -d`. Data persists in `parkmaster_pgdata` volume.
