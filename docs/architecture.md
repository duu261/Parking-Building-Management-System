# ParkMaster Architecture

**Last updated:** 2026-06-24

## Overview

ParkMaster is a full-stack Parking Building Management System built for FPT University SWP391 capstone. The codebase follows a **layered architecture** with clear separation of concerns:

- **Backend:** Spring Boot 3 (Java 21) + Spring Data JPA + PostgreSQL
- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 + React Router v7
- **Deployment:** Vercel (frontend) + Render (backend) + Neon (PostgreSQL)

---

## Tech Stack

### Backend
- **Framework:** Spring Boot 3.3
- **Language:** Java 21
- **Build Tool:** Maven (via `mvnd`)
- **Database:** PostgreSQL 16 (Flyway migrations)
- **Security:** Spring Security + JWT (JJWT)
- **API:** REST with RFC 7807 error format
- **Testing:** JUnit 5, Mockito, Testcontainers
- **Dev Tools:** Spring Data JPA, Lombok

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **HTTP Client:** Fetch API with custom wrapper
- **Auth:** JWT (localStorage) + role-based routing
- **Testing:** Vitest, Playwright

---

## Backend Package Layout

All packages under `com.parkmaster.*`:

```
com.parkmaster/
├── ParkMasterApplication.java       # Spring Boot entry point
├── auth/                            # Authentication & authorization
│   ├── AuthController              # POST /api/auth
│   ├── AuthService                 # Registration, login, password reset
│   ├── JwtService                  # JWT token generation & validation
│   ├── PasswordResetTokenRepository
│   └── AuthDtos                     # Request/response DTOs
├── security/                        # Spring Security config
│   ├── SecurityConfig              # Role-based access control
│   ├── JwtAuthFilter               # JWT extraction & validation filter
│   └── CustomUserDetails           # Spring Security user principal
├── user/                           # User & role management
│   ├── AdminUserService            # User CRUD (admin only)
│   ├── UserRepository
│   ├── User (entity)
│   └── Role (enum)
├── parking/                        # Core parking domain
│   ├── ParkingService              # Building/floor/slot CRUD
│   ├── ParkingBuildingRepository
│   ├── FloorRepository
│   ├── ParkingSlotRepository
│   ├── ParkingBuilding (entity)
│   ├── Floor (entity)
│   ├── ParkingSlot (entity)
│   └── SlotStatus (enum: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, LOCKED)
├── pricing/                        # Vehicle types & pricing policies
│   ├── PricingService              # Pricing CRUD & queries
│   ├── VehicleTypeRepository
│   ├── PricingPolicyRepository
│   ├── VehicleType (entity)
│   └── PricingPolicy (entity)
├── session/                        # Parking sessions (check-in/check-out)
│   ├── ParkingSessionService       # Session lifecycle management
│   ├── SlotAllocationService       # AI-powered slot allocation (RQ2-RQ4)
│   ├── ParkingSessionRepository
│   ├── ParkingSession (entity)
│   ├── ParkingTicket (entity)
│   └── ChargeCalculator            # Grace period + daily cap logic
├── reservation/                    # Pre-booking management
│   ├── ReservationService          # Reservation CRUD & expiry
│   ├── ReservationRepository
│   ├── Reservation (entity)
│   └── ReservationExpiryJob        # Scheduled job to expire old reservations
├── pass/                           # Monthly passes
│   ├── MonthlyPassService          # Pass issue/revoke + validation
│   ├── MonthlyPassRepository
│   └── MonthlyPass (entity)
├── payment/                        # Payment processing
│   ├── PaymentService              # Payment CRUD & settlement
│   ├── VnPayService                # VNPay integration (online payments)
│   ├── PaymentRepository
│   ├── Payment (entity)
│   └── PaymentMethod (enum: CASH, ONLINE, VNPAY)
├── exceptionreport/                # Parking violations & issues
│   ├── ExceptionReportService      # Report creation & resolution
│   ├── ExceptionReportRepository
│   ├── ExceptionReport (entity)
│   └── ReportType (enum: LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE)
├── feedback/                       # Customer feedback
│   ├── FeedbackService             # Feedback submission & retrieval
│   ├── FeedbackRepository
│   └── Feedback (entity)
├── report/                         # Manager analytics & reports
│   ├── ReportService               # Query building reports, analytics
│   └── Report-related DTOs
├── assistant/                      # AI assistant
│   ├── AssistantController         # GET /api/public/assistant
│   ├── AssistantService            # Context-aware Q&A with RAG
│   └── Knowledge base (built-in prompts for allocation, payment, exceptions, feedback)
├── publicapi/                      # Public endpoints (no auth required)
│   ├── PublicController            # GET /api/public/* (health, overview, pricing, availability)
│   └── Public DTOs
├── common/                         # Cross-cutting concerns
│   ├── GlobalExceptionHandler      # Centralized exception handling (RFC 7807)
│   ├── ApiException                # Custom exception for API errors
│   ├── ApiResponse<T>              # Standard response envelope
│   └── Validation utils
└── dev/                            # Development utilities
    └── DevDataSeeder               # Seeds test data in dev profile
```

---

## Controller Layer

All controllers are stateless and handle HTTP request/response mapping. They delegate business logic to services.

### Role-Based Access Control

Security is enforced in `SecurityConfig.java`:

```
/api/auth/**              → Public (no auth required)
/api/public/**            → Public (no auth required)
/api/admin/**             → Requires ADMIN role
/api/manager/**           → Requires ADMIN or MANAGER role
/api/staff/**             → Requires ADMIN, MANAGER, or STAFF role
/api/driver/**            → Requires ADMIN or USER (driver) role
```

### Controllers by Role

#### Public
- **PublicController** (`/api/public`)
  - `GET /health` — Health check
  - `GET /buildings` — List all buildings
  - `GET /buildings/{id}/availability` — Slot availability by building
  - `GET /buildings/{id}/floors` — Floors in building
  - `GET /floors/{floorId}/slots` — Slots on floor
  - `GET /pricing` — Current pricing policies
  - `GET /buildings/{id}/allocation-preview` — Preview allocation scoring (no auth)

- **PublicPaymentController** (`/api/public/payments`)
  - `POST /vnpay-callback` — VNPay payment callback (webhook)

- **AssistantController** (`/api/public/assistant`)
  - `POST /chat` — AI assistant Q&A (context-aware, no auth required)

#### Authentication
- **AuthController** (`/api/auth`)
  - `POST /register` — User registration
  - `POST /login` — Login (returns JWT)
  - `POST /forgot-password` — Request password reset token
  - `POST /reset-password` — Reset password with token

#### Admin (User Management)
- **AdminUserController** (`/api/admin/users`)
  - `GET /` — List all users
  - `POST /` — Create new user
  - `GET /{id}` — Get user details
  - `PUT /{id}` — Update user
  - `DELETE /{id}` — Delete user
  - `PUT /{id}/role` — Change user role

#### Manager (Building & Operations)
- **ManagerParkingController** (`/api/manager`)
  - **Buildings:**
    - `POST /buildings` — Create building
    - `GET /buildings` — List buildings
    - `GET /buildings/{id}` — Get building details
    - `PUT /buildings/{id}` — Update building
    - `DELETE /buildings/{id}` — Delete building
  - **Floors:**
    - `POST /buildings/{buildingId}/floors` — Add floor
    - `GET /buildings/{buildingId}/floors` — List floors
    - `DELETE /floors/{id}` — Delete floor
  - **Slots:**
    - `POST /floors/{floorId}/slots` — Add slots
    - `GET /floors/{floorId}/slots` — List slots on floor
    - `DELETE /slots/{id}` — Delete slot
    - `PATCH /slots/{id}/status` — Update slot status
  - **Floor Config:**
    - `PATCH /floors/{id}/vehicle-type` — Update floor vehicle type
  - **Analytics:**
    - `GET /buildings/{buildingId}/analytics/allocation` — Allocation metrics by floor

- **ManagerPricingController** (`/api/manager/pricing`)
  - `POST /vehicle-types` — Create vehicle type
  - `GET /vehicle-types` — List vehicle types
  - `GET /vehicle-types/{id}` — Get vehicle type details
  - `PUT /vehicle-types/{id}` — Update vehicle type
  - `DELETE /vehicle-types/{id}` — Delete vehicle type
  - `PUT /vehicle-types/{vehicleTypeId}/pricing` — Set pricing policy
  - `GET /vehicle-types/{vehicleTypeId}/pricing` — Get pricing policy
  - `DELETE /vehicle-types/{vehicleTypeId}/pricing` — Remove pricing
  - `GET /pricing` — List all pricing policies

- **ManagerPaymentController** (`/api/manager/payments`)
  - `GET /` — List all payments
  - `GET /{id}` — Payment details
  - `PUT /{id}/settle` — Mark payment as settled

- **ManagerPassController** (`/api/manager/passes`)
  - `GET /` — List all monthly passes
  - `GET /{id}` — Pass details
  - `POST /{id}/revoke` — Revoke active pass

- **ManagerExceptionController** (`/api/manager/exceptions`)
  - `GET /` — List all exception reports
  - `GET /open` — List open reports
  - `POST /{id}/resolve` — Resolve report

- **ManagerFeedbackController** (`/api/manager/feedback`)
  - `GET /` — List all feedback
  - `GET /{id}` — Feedback details
  - `DELETE /{id}` — Delete feedback

- **ManagerReportController** (`/api/manager/reports`)
  - `GET /daily` — Daily analytics
  - `GET /monthly` — Monthly analytics
  - `GET /sessions` — Session statistics
  - `GET /revenue` — Revenue breakdown

#### Staff (Operations & Support)
- **StaffSessionController** (`/api/staff/sessions`)
  - `POST /check-in` — Initiate check-in (AI allocates slot, generates ticket)
  - `POST /{id}/check-out` — Process check-out (calculates charge)
  - `GET /active` — List active sessions
  - `GET /{id}` — Session details
  - `GET /by-ticket/{ticketCode}` — Lookup session by ticket code
  - `GET /by-plate` — Lookup session by license plate
  - `GET /{id}/ticket.png` — Download ticket image

- **StaffPaymentController** (`/api/staff/payments`)
  - `GET /` — List pending payments
  - `POST /{paymentId}/mark-paid` — Mark cash payment as paid

- **StaffExceptionController** (`/api/staff/exceptions`)
  - `POST /` — Create exception report
  - `GET /` — List exception reports

- **StaffLookupController** (`/api/staff`)
  - `GET /vehicle-types` — List vehicle types for check-in form
  - `GET /buildings` — List buildings
  - `GET /buildings/{buildingId}/floors` — List floors in building
  - `GET /floors/{floorId}/slots` — List slots on floor
  - `GET /pass-lookup?plate=` — Check active pass by plate

#### Driver (User Self-Service)
- **DriverSessionController** (`/api/driver/sessions`)
  - `GET /` — List driver's parking sessions (active & history)
  - `GET /{id}` — Session details
  - `GET /{id}/ticket.png` — Download parking ticket as image

- **DriverPaymentController** (`/api/driver/payments`)
  - `GET /` — List pending payments
  - `POST /{paymentId}/pay` — Initiate payment
  - `POST /{paymentId}/pay-online` — Initiate VNPay payment

- **DriverReservationController** (`/api/driver/reservations`)
  - `POST /` — Create reservation
  - `GET /` — List driver's reservations
  - `DELETE /{id}` — Cancel reservation

- **DriverPassController** (`/api/driver/passes`)
  - `GET /` — List driver's monthly passes
  - `POST /` — Purchase monthly pass (VNPay)
  - `GET /{id}` — Pass details

- **DriverFeedbackController** (`/api/driver/feedback`)
  - `POST /` — Submit feedback
  - `GET /` — List own feedback

- **DriverProfileController** (`/api/driver/profile`)
  - `GET /` — Get profile
  - `PUT /` — Update profile
  - `POST /change-password` — Change password

---

## Service Layer

Services contain all business logic and orchestrate repository access. All services use constructor injection (dependency inversion).

### Core Services

| Service | Responsibility |
|---------|-----------------|
| **AuthService** | User registration, login, JWT validation, password reset |
| **AdminUserService** | User CRUD, role assignment |
| **ParkingService** | Building/floor/slot management, availability queries |
| **PricingService** | Vehicle type & pricing policy CRUD |
| **ParkingSessionService** | Check-in/check-out, session lifecycle, ticket generation |
| **SlotAllocationService** | AI scoring algorithm (RQ2-RQ4): vehicle type match, load balance, distance, peak-hour factor |
| **ReservationService** | Reservation creation/cancellation, expiry handling |
| **PaymentService** | Payment recording, settlement, charge calculation |
| **VnPayService** | VNPay gateway integration (VNPAY API calls) |
| **MonthlyPassService** | Pass issuance, validation, revocation |
| **ExceptionReportService** | Report creation/resolution (lost ticket, wrong plate, overtime, wrong zone) |
| **FeedbackService** | Feedback submission & retrieval |
| **ReportService** | Analytics queries (daily, monthly, revenue, session stats) |
| **AssistantService** | Context-aware Q&A with built-in knowledge base (allocation, payment, exception, feedback) |
| **JwtService** | Token generation, validation, claims extraction (security) |

### Key Business Logic

#### ChargeCalculator
Calculates parking charges:
- Base rate by vehicle type & pricing policy
- Grace period (e.g., first 15 minutes free)
- Daily cap (e.g., max 100k per day)
- Monthly pass active? → Charge = 0

#### SlotAllocationService
Scores available slots for AI-powered allocation (RQ2-RQ4):
- **Vehicle Type Match** (40 pts) — Exact type vs generic slot
- **Load Balance** (30 pts) — Prefer emptier floors to spread usage
- **Distance to Entry** (20 pts) — Prefer closer slots
- **Peak Hour Factor** (10 pts) — Adjust priority during rush hours

Returns ranked slot list; driver chooses or system auto-assigns.

#### ReservationExpiryJob
Scheduled task that:
- Runs periodically (e.g., every 10 minutes)
- Finds reservations past expiry time
- Sets status to EXPIRED
- Frees up reserved slots

---

## Repository Layer

Spring Data JPA repositories provide CRUD + custom query access to the database.

| Repository | Entity |
|-----------|--------|
| UserRepository | User |
| PasswordResetTokenRepository | PasswordResetToken |
| ParkingBuildingRepository | ParkingBuilding |
| FloorRepository | Floor |
| ParkingSlotRepository | ParkingSlot |
| VehicleTypeRepository | VehicleType |
| PricingPolicyRepository | PricingPolicy |
| ParkingSessionRepository | ParkingSession |
| ParkingTicketRepository | ParkingTicket |
| ReservationRepository | Reservation |
| PaymentRepository | Payment |
| MonthlyPassRepository | MonthlyPass |
| ExceptionReportRepository | ExceptionReport |
| FeedbackRepository | Feedback |

---

## Database Schema

Managed by **Flyway** migrations (version-controlled SQL):
- `V1__init.sql` — Core tables (users, buildings, floors, slots)
- `V2__parking_sessions.sql` — Sessions and tickets
- `V3__pricing.sql` — Vehicle types and pricing policies
- `V4__reservations.sql` — Reservations table
- `V5__payments.sql` — Payments table
- And so on...

**Key Enums:**
- `SlotStatus`: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, LOCKED
- `Role`: ADMIN, MANAGER, STAFF, USER (driver)
- `PaymentMethod`: CASH, ONLINE, VNPAY
- `ReportType`: LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE
- `ReservationStatus`: PENDING, ACTIVE, EXPIRED, CANCELLED
- `PaymentStatus`: PENDING, COMPLETED, FAILED

---

## Security & Authentication

### JWT Flow
1. **Register/Login** → AuthService generates JWT token (HS256, 256-bit secret)
2. **Client stores** token in `localStorage` (key: `accessToken`)
3. **Each request** includes `Authorization: Bearer <token>` header
4. **JwtAuthFilter** extracts & validates token, loads user context
5. **@PreAuthorize** / role checks enforce authorization

### Role-Based Access Control (RBAC)

Configured in `SecurityConfig.java`:
```
ADMIN        → /api/admin/** (full system access)
MANAGER      → /api/manager/** + /api/admin/** (building operations)
STAFF        → /api/staff/** + /api/manager/** + /api/admin/** (check-in/out, reports)
USER (driver)→ /api/driver/** (self-service: sessions, payments, reservations)
```

### Password Security
- Stored with **BCrypt** (never plaintext or MD5)
- Password reset: temporary token + expiry validation
- Change password: authenticate first, then hash new password

---

## Error Handling

**GlobalExceptionHandler** catches all exceptions and returns RFC 7807 format:
```json
{
  "type": "https://api.parkmaster.com/errors/not-found",
  "status": 404,
  "title": "Not Found",
  "detail": "Parking session with ID 123 not found",
  "timestamp": "2026-06-24T10:00:00Z"
}
```

**Custom Exceptions** (all unchecked):
- `ApiException` — Base exception with HTTP status & message
- `ResourceNotFoundException` — 404 (entity not found)
- `UnauthorizedException` — 401 (auth failed)
- `ForbiddenException` — 403 (insufficient permissions)
- `ValidationException` — 400 (invalid input)
- `ConflictException` — 409 (business rule violation, e.g., slot already occupied)

---

## Frontend Architecture

Located under `frontend/` with full separation from backend.

### Structure

```
frontend/src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── SignUpPage.jsx
│   │   └── ForgotPasswordPage.jsx
│   ├── public/
│   │   ├── LandingPage.jsx           # Public overview (guest-facing)
│   │   └── PublicPricingPage.jsx     # Pricing info
│   ├── system/
│   │   ├── AdminOverviewPage.jsx
│   │   ├── AdminUsersPage.jsx
│   │   ├── ManagerBuildingsPage.jsx
│   │   ├── ManagerAnalyticsPage.jsx
│   │   ├── ManagerReportsPage.jsx
│   │   ├── StaffCheckInPage.jsx
│   │   ├── StaffCheckOutPage.jsx
│   │   └── StaffLookupPage.jsx
│   └── user/
│       ├── DriverMySessionsPage.jsx
│       ├── DriverPaymentsPage.jsx
│       ├── DriverReservationsPage.jsx
│       ├── DriverPassesPage.jsx
│       ├── DriverProfilePage.jsx
│       └── DriverFeedbackPage.jsx
├── components/
│   ├── AdminLayout.jsx               # Admin sidebar + route guards
│   ├── ManagerLayout.jsx             # Manager sidebar + route guards
│   ├── StaffLayout.jsx               # Staff sidebar + route guards
│   ├── UserLayout.jsx                # Driver sidebar + route guards
│   ├── AiAssistant.jsx               # Context-aware chat widget
│   ├── ProtectedRoute.jsx            # Role-based route guard
│   ├── common/                       # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Card.jsx
│   │   ├── Form components
│   │   └── etc.
│   └── domain-specific/              # Feature-specific components
│       ├── SessionCard.jsx
│       ├── PaymentForm.jsx
│       ├── SlotGrid.jsx
│       └── etc.
├── lib/
│   ├── api.js                        # HTTP client with JWT injection
│   ├── endpoints.js                  # API path constants
│   └── utils.js                      # Formatting, validation helpers
├── hooks/
│   ├── useAuth.js                    # Auth state & login/logout
│   ├── useSession.js                 # Current parking session state
│   ├── useUser.js                    # User profile fetching
│   └── etc.
├── App.jsx                           # Main router, role-based routing
├── main.jsx                          # React entrypoint
└── index.css                         # Global styles

vite.config.js                         # Build config + /api proxy to localhost:5000
```

### Authentication Flow (Frontend)

1. **Login** → POST `/api/auth/login` → get JWT token + user object
2. **Store** → `localStorage.accessToken` + `localStorage.user` (JSON)
3. **Protected routes** → Check `localStorage.user.role`, render appropriate layout
4. **API calls** → `api.js` automatically adds `Authorization: Bearer` header
5. **Logout** → Clear localStorage, redirect to login
6. **Inactivity** → Auto-logout after 15 minutes of no activity

### API Communication

`lib/api.js` wrapper:
```javascript
export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  // Handle errors, return JSON
};
```

`lib/endpoints.js` centralizes API paths:
```javascript
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  driver: {
    sessions: '/driver/sessions',
    payments: '/driver/payments',
  },
  // etc.
};
```

### Components

- **Stateless presentational components** for UI
- **Stateful container components** for data fetching (using React hooks)
- **ProtectedRoute** wraps routes to enforce role-based access
- **AiAssistant** global chat widget (context-aware Q&A)

---

## Development Workflow

### Backend

```bash
cd backend

# Build & run tests
mvnd test

# Start dev server (with seeder)
mvnd spring-boot:run -Dspring-boot.run.profiles=dev

# Port: 5000
# Seeder: Runs on startup, populates dev data (2 buildings, 6 floors, 86 slots)
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Dev server (proxies /api to localhost:5000)
npm run dev
# Port: 5173, accessible at http://localhost:5173

# For LAN access (e.g., mobile testing)
npx vite --host
# Access via: http://<your-lan-ip>:5173

# Build for production
npm run build

# Lint
npm run lint
```

### Database (Local Dev)

Uses PostgreSQL via Docker Compose:
```bash
docker-compose up -d postgres
# Creates database, runs Flyway migrations on backend startup
```

---

## Deployment

### Two-Branch Workflow

- **`main`** — Active development, frequent pushes
- **`deploy`** — Stable branch tracked by Render & Vercel

To deploy to production:
```bash
git checkout deploy
git merge main
git push origin deploy
```

Render & Vercel auto-deploy on push to `deploy`.

### Hosting

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Auto-builds from `deploy` branch |
| Backend | Render | Auto-builds from `deploy` branch, runs seeder in dev profile |
| Database | Neon | Managed PostgreSQL, auto-backups |

### Environment Variables

**Backend** (`application-prod.yml`):
- `SPRING_DATASOURCE_URL` — Neon PostgreSQL connection
- `SPRING_DATASOURCE_USERNAME` — DB user
- `SPRING_DATASOURCE_PASSWORD` — DB password
- `JWT_SECRET` — 256-bit HS256 signing key
- `PARKMASTER_CORS_ALLOWED_ORIGINS` — Frontend URL for CORS

**Frontend** (`vite.config.js`):
- `VITE_API_URL` — Backend base URL (e.g., `https://parkmaster-api.render.com`)

### Health Check

UptimeRobot pings `GET /api/public/health` every 14 minutes to prevent Render spin-down.

---

## Research Questions (RBL Component)

The AI slot allocation system directly addresses the research questions for grading:

### RQ1: Floor/Zone Segmentation Effect
- Slot `location.floor` + `type.category` → measure fill-rate by floor/zone
- Compare historical sessions by zone

### RQ2: Auto Allocation vs Free Choice
- SlotAllocationService provides ranked suggestions
- Measure time-to-park: manual pick vs AI-recommended
- Query: sessions with auto-allocation vs manual selection

### RQ3: Most Important Allocation Criteria
- SlotAllocationService scoring weights:
  - Vehicle type match: **40%**
  - Load balance: **30%**
  - Distance to entry: **20%**
  - Peak hour: **10%**
- Adjust weights, re-run tests, measure impact on utilization

### RQ4: Peak-Hour Utilization Improvement
- ChargeCalculator + peak-hour factor in scoring
- Compare utilization before/after peak-hour scoring enabled
- Query: sessions during peak hours with allocation enabled

---

## Key Design Decisions

### Immutability
- Java: Return defensive copies from public APIs (`List.copyOf()`, etc.)
- React: Immutable state updates with spread operators or Immer
- Database: No soft deletes; hard delete with cascading (explicit GDPR compliance)

### Error Handling
- Services throw domain exceptions
- GlobalExceptionHandler converts to RFC 7807 format
- Logs include context; responses are generic (no stack traces to clients)

### Testing
- **Unit tests** mock services, test business logic (80%+ coverage target)
- **Integration tests** use Testcontainers for real database
- **E2E tests** cover critical user flows (check-in, payment, reservation)

### Caching
- No query-level caching (keep it simple)
- Frontend caches in `localStorage` + React state
- Database indexes on frequently-queried columns (plate, sessionId, buildingId)

---

## Common Tasks

### Add a New API Endpoint

1. **Controller** → Add method with `@PostMapping`, `@GetMapping`, etc.
2. **Service** → Implement business logic
3. **Repository** → Add custom query if needed
4. **Test** → Unit test service, integration test endpoint
5. **Security** → Verify role-based access in SecurityConfig
6. **Frontend** → Add API call in `lib/endpoints.js`, create UI component

### Add a New Database Table

1. **Entity** → Create JPA entity class with `@Entity`, `@Table`, fields
2. **Repository** → Extend `JpaRepository<T, ID>`
3. **Migration** → Create Flyway SQL file (`V<N>__description.sql`)
4. **Service** → CRUD logic
5. **Test** → Integration test with Testcontainers

### Deploy to Production

1. Test locally: `mvnd test`, `npm run build`
2. Push to main: `git push origin main`
3. Verify on main branch: CI/CD runs tests
4. Merge to deploy: `git checkout deploy && git merge main && git push origin deploy`
5. Render & Vercel auto-deploy within 1-2 minutes

---

## References

- **Spring Boot:** https://spring.io/projects/spring-boot
- **React:** https://react.dev
- **PostgreSQL:** https://www.postgresql.org/docs/
- **JWT:** https://jwt.io/
- **RFC 7807 (Problem Details):** https://tools.ietf.org/html/rfc7807
- **Project CLAUDE.md:** See `CLAUDE.md` for stack decisions and local dev setup
