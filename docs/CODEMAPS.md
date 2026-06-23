# Documentation Index — ParkMaster

**Last Updated:** 2026-06-24  
**Purpose:** Central reference for navigating ParkMaster architecture and codebases.

---

## Architecture & Design

**[architecture.md](./architecture.md)**
- System overview: Frontend (React 19 + Vite) → Backend (Spring Boot 3.3)
- Security layer: JWT auth, role-based routing
- Controller layer: 18 REST endpoints across auth, public, driver, staff, manager, admin
- Service layer: Business logic, AI slot allocation, charge calculation
- Repository layer: Spring Data JPA, Flyway migrations
- Package structure: 14 domains (auth, parking, pricing, session, payment, reservation, exception, feedback, pass, assistant, user, security, dev, report)

**[erd.md](./erd.md)**
- Entity relationships: User, ParkingBuilding, Floor, ParkingSlot, VehicleType, PricingPolicy
- Session lifecycle: ParkingSession → ParkingTicket → Payment → Feedback
- Reservations, monthly passes, exception reports
- Database schema managed by Flyway (`V*.sql` migrations)

---

## API Documentation

**[api-docs.md](./api-docs.md)**
- Complete REST endpoint reference with method, path, parameters, response
- Auth endpoints: register, login (JWT)
- Public endpoints: health, buildings, pricing, AI allocation preview, AI chat assistant, VNPay callback
- Driver endpoints: sessions, payments, reservations, monthly passes, feedback
- Staff endpoints: lookups (buildings, floors, slots), check-in/out, payments, exceptions
- Manager endpoints: building/floor/slot CRUD, pricing policies, reports, exception management, feedback analytics
- Admin endpoints: user management, role administration
- Enums: Role, SlotStatus, SessionStatus, PaymentMethod, ExceptionType, PassStatus
- Error format: RFC 7807 problem details

---

## External Integrations

**[integrations.md](./integrations.md)** (NEW)
- **Google Gemini API:** AI chat assistant with parking knowledge base, fallback to local responses on timeout/quota
- **VNPay Payment Gateway:** Vietnamese payment aggregator, sandbox + production, webhook verification, HMAC-SHA512 security
- Configuration, workflow, security, testing, monitoring, error handling

---

## Background Jobs

**[workers.md](./workers.md)** (NEW)
- **Reservation Expiry Job:** Automatic cleanup of expired pending reservations every 5 minutes
- Schedule configuration, monitoring, performance tuning
- Candidates for future jobs: session timeout, pass expiry, report generation, payment reconciliation

---

## Domain-Specific Documentation

**[use-cases.md](./use-cases.md)**
- User flows per role (driver, staff, manager, admin)
- Parking session lifecycle
- Payment workflows
- Exception handling
- Monthly pass purchase

**[user-flows.md](./user-flows.md)**
- Detailed step-by-step flows with wireframes / ASCII diagrams
- Login, check-in, check-out, payment, reservation, exception report, feedback

**[test-plan.md](./test-plan.md)**
- Unit, integration, E2E test coverage
- Test data, seeder, mock setup
- Critical paths: check-in → check-out → payment, reservation → fulfillment

---

## Feature Specifications

**[docs/features/](./features/)** — Instructor presentation notes per feature:
- `ai-assistant.md` — Chat endpoint, knowledge base, fallback behavior
- `ai-slot-allocation.md` — Scoring algorithm, criteria (vehicle type, floor load, distance, peak hour)
- `parking-session.md` — Check-in, check-out, charge calculation, grace period, daily cap
- `reservation.md` — Pre-book with AI allocation, TTL expiry, cancellation
- `payment.md` — CASH/ONLINE/VNPAY methods, settlement workflow
- `vnpay-payment.md` — Integration setup, webhook security, sandbox testing
- `monthly-pass.md` — Driver purchase via VNPay, subscription model, auto-activate
- `exception-report.md` — Lost ticket, wrong plate, overtime, wrong zone, resolution
- `feedback.md` — Driver rating, comment, analytics
- `vehicle-type-pricing.md` — Pricing tiers by vehicle type, rate/hour, grace/daily cap

---

## Project Setup & Deployment

**[README.md](./README.md)**
- Quick start: npm/mvn commands
- Frontend: `npm run dev` (localhost:5173, proxies /api to :5000)
- Backend: `mvnd spring-boot:run` (localhost:5000)
- Database: PostgreSQL via Docker

**[contributing.md](./contributing.md)**
- Code style (English only), branching, commit conventions, PR process

**[env.md](./env.md)**
- Environment variables: database URL, API keys (Gemini, VNPay), JWT secret, etc.

**[demo-accounts.md](./demo-accounts.md)**
- Test credentials for each role (admin, manager, staff, driver, guest)

**[DEPLOY.md](./DEPLOY.md)** (gitignored local reference)
- Production deployment to Vercel (frontend) + Render (backend) + Neon (PostgreSQL)
- Two-branch workflow: `main` (dev) → `deploy` (prod)
- UptimeRobot heartbeat, Seeder runs in dev profile

---

## Requirements & Analysis

**[srs.md](./srs.md)**
- Software Requirements Specification
- Functional requirements per role
- Non-functional requirements (performance, security, availability)
- Research questions (RQ1–RQ4) on AI allocation effectiveness

---

## Codebase Organization

### Backend (`backend/src/main/java/com/parkmaster/`)
- `auth/` — AuthController, AuthService, JWT token handling
- `security/` — JwtAuthFilter, SecurityConfig, role routing
- `user/` — User entity, roles, UserRepository
- `parking/` — Building, Floor, ParkingSlot, SlotStatus enum
- `pricing/` — VehicleType, PricingPolicy, charge calculation
- `session/` — ParkingSession, ParkingTicket, SlotAllocationService (AI), ChargeCalculator
- `reservation/` — Reservation, ReservationExpiryJob (5-min scheduled cleanup)
- `payment/` — Payment, PaymentMethod enum, VnPayService, PublicPaymentController (webhook), DriverPaymentController, StaffPaymentController, ManagerPaymentController
- `pass/` — MonthlyPass, ManagerPassController, DriverPassController (new)
- `exceptionreport/` — ExceptionReport, ExceptionType enum, StaffExceptionController, ManagerExceptionController
- `feedback/` — Feedback, DriverFeedbackController, ManagerFeedbackController
- `assistant/` — GeminiClient, AssistantService, AssistantController (AI chat)
- `report/` — ManagerReportController (analytics, fill rate, session duration)
- `publicapi/` — PublicController (guest endpoints: buildings, pricing, allocation preview)
- `common/` — GlobalExceptionHandler (RFC 7807), ApiException, common DTOs
- `dev/` — SeederService (test data: 2 buildings, 6 floors, 86 slots, 5 sessions, historical 30-day data)

### Frontend (`frontend/src/`)
- `pages/auth/` — LoginPage, SignUpPage
- `pages/public/` — LandingPage (guest SEO, hero, features, CTA)
- `pages/system/` — AdminOverviewPage, UsersPage, AnalyticsPage, etc. (role-based views)
- `pages/user/` — Driver views: MySessionsPage, ReservationsPage, PaymentsPage, PassesPage, FeedbackPage
- `components/` — AdminLayout, UserLayout, AiAssistant, UI library
- `lib/api.js` — apiRequest() helper (attaches Bearer token from localStorage)
- `lib/endpoints.js` — API path constants
- `routes/ProtectedRoute.jsx` — Role-based guard
- `App.jsx` — Main router, role-based layout selection, inactivity logout (15 min)

---

## Key Metrics & Performance

**Test Coverage:** 100+ tests, all domains, unit + integration

**Deployment:**
- Frontend: Vercel (React SPA)
- Backend: Render (Spring Boot)
- Database: Neon (PostgreSQL)
- Health check: `/api/public/health` every 14 min via UptimeRobot

**Performance Targets:**
- AI allocation: <100ms ranking 12+ candidates
- Check-in: <200ms (DB + slot allocation)
- VNPay webhook: <5s response
- API timeout: 30s default (shorter for UI-facing)

**Security:**
- JWT auth (jjwt library), role-based routing, no hardcoded secrets
- Payment: HMAC-SHA512 signature verification
- Input validation at all boundaries
- RFC 7807 error format (no stack traces in production)

---

## How to Navigate

1. **New to the project?** Start with [architecture.md](./architecture.md) + [use-cases.md](./use-cases.md)
2. **Building a feature?** Check [api-docs.md](./api-docs.md) for endpoint contracts, then [docs/features/](./features/) for design notes
3. **Integrating external service?** See [integrations.md](./integrations.md) (Gemini, VNPay)
4. **Running background jobs?** See [workers.md](./workers.md)
5. **Setting up locally?** Start with [README.md](./README.md), [env.md](./env.md), [demo-accounts.md](./demo-accounts.md)
6. **Deploying to production?** See [DEPLOY.md](./DEPLOY.md) (local reference)

---

## Last Updated

- **architecture.md:** 2026-06-24
- **api-docs.md:** 2026-06-24
- **erd.md:** 2026-06-24
- **integrations.md:** 2026-06-24 (NEW)
- **workers.md:** 2026-06-24 (NEW)
- All other docs: See individual file headers
