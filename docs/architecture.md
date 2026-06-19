# Architecture — ParkMaster

---

## System Architecture

```
                           ┌─────────────────────────────────┐
                           │           BROWSER               │
                           │                                 │
                           │  React 19 SPA (Vite + Tailwind) │
                           │  ┌───────────┐ ┌─────────────┐ │
                           │  │ React     │ │ localStorage│ │
                           │  │ Router v7 │ │ JWT + User  │ │
                           │  └───────────┘ └─────────────┘ │
                           └──────────┬──────────────────────┘
                                      │ HTTPS
                                      │ Bearer JWT
                           ┌──────────▼──────────────────────┐
                           │        VITE DEV PROXY            │
                           │    /api/* → localhost:5000       │
                           │  (prod: VITE_API_URL → Render)  │
                           └──────────┬──────────────────────┘
                                      │
          ┌───────────────────────────▼───────────────────────────┐
          │                  SPRING BOOT 3.3                      │
          │                  (Port 5000, JDK 21+)                 │
          │                                                       │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │              SECURITY LAYER                      │  │
          │  │  JwtAuthFilter → SecurityConfig (role routing)   │  │
          │  │                                                  │  │
          │  │  /api/auth/**      → permitAll                   │  │
          │  │  /api/public/**    → permitAll                   │  │
          │  │  /api/admin/**     → ADMIN                       │  │
          │  │  /api/manager/**   → ADMIN, MANAGER              │  │
          │  │  /api/staff/**     → ADMIN, MANAGER, STAFF       │  │
          │  │  /api/driver/**    → ADMIN, USER                 │  │
          │  └─────────────────────────────────────────────────┘  │
          │                                                       │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │           CONTROLLER LAYER (REST)                │  │
          │  │                                                  │  │
          │  │  AuthController          /api/auth               │  │
          │  │  PublicController         /api/public             │  │
          │  │  AdminUserController      /api/admin/users        │  │
          │  │  ManagerBuildingController /api/manager/buildings  │  │
          │  │  ManagerPricingController  /api/manager/*          │  │
          │  │  ManagerReportController   /api/manager/reports    │  │
          │  │  StaffSessionController   /api/staff/sessions     │  │
          │  │  StaffPaymentController   /api/staff/payments     │  │
          │  │  StaffExceptionController /api/staff/exceptions   │  │
          │  │  StaffLookupController    /api/staff/buildings    │  │
          │  │  DriverSessionController  /api/driver/sessions    │  │
          │  │  DriverReservationController /api/driver/reserv.  │  │
          │  │  DriverPaymentController  /api/driver/payments    │  │
          │  └─────────────────────────────────────────────────┘  │
          │                         │                             │
          │  ┌──────────────────────▼──────────────────────────┐  │
          │  │            SERVICE LAYER                         │  │
          │  │                                                  │  │
          │  │  AuthService         ParkingService               │  │
          │  │  AdminUserService    PricingService                │  │
          │  │  ParkingSessionService  ReservationService         │  │
          │  │  PaymentService      ExceptionReportService        │  │
          │  │  ReportService       ChargeCalculator              │  │
          │  │                                                  │  │
          │  │  ┌──────────────────────────────────────┐        │  │
          │  │  │  SlotAllocationService (AI)           │        │  │
          │  │  │  Weighted scoring: 4 criteria         │        │  │
          │  │  │  vehicleTypeMatch(40)                 │        │  │
          │  │  │  loadBalance(30)                      │        │  │
          │  │  │  distanceToEntry(20)                  │        │  │
          │  │  │  peakHour(10)                         │        │  │
          │  │  └──────────────────────────────────────┘        │  │
          │  └─────────────────────────────────────────────────┘  │
          │                         │                             │
          │  ┌──────────────────────▼──────────────────────────┐  │
          │  │          REPOSITORY LAYER (Spring Data JPA)      │  │
          │  │                                                  │  │
          │  │  UserRepository          ParkingBuildingRepo     │  │
          │  │  FloorRepository         ParkingSlotRepository   │  │
          │  │  VehicleTypeRepository    PricingPolicyRepository │  │
          │  │  ParkingSessionRepository ReservationRepository   │  │
          │  │  PaymentRepository       ExceptionReportRepo     │  │
          │  └─────────────────────────────────────────────────┘  │
          │                         │                             │
          │  ┌──────────────────────▼──────────────────────────┐  │
          │  │          ENTITY LAYER (JPA / Hibernate)          │  │
          │  │                                                  │  │
          │  │  User  ParkingBuilding  Floor  ParkingSlot       │  │
          │  │  VehicleType  PricingPolicy  ParkingSession      │  │
          │  │  Reservation  Payment  ExceptionReport           │  │
          │  │                                                  │  │
          │  │  8 enums: Role, SlotStatus, SessionStatus,       │  │
          │  │  ReservationStatus, PaymentStatus, PaymentMethod, │  │
          │  │  ExceptionType, ExceptionStatus                  │  │
          │  └─────────────────────────────────────────────────┘  │
          │                         │                             │
          │  ┌──────────────────────▼──────────────────────────┐  │
          │  │          FLYWAY MIGRATIONS                       │  │
          │  │  V1  users                                       │  │
          │  │  V2  parking_building, floor, parking_slot       │  │
          │  │  V3  vehicle_type, pricing_policy                │  │
          │  │  V4  parking_session                             │  │
          │  │  V5+ reservation, payment, exception_report ...  │  │
          │  └─────────────────────────────────────────────────┘  │
          └───────────────────────────┬───────────────────────────┘
                                      │ JDBC
                           ┌──────────▼──────────────────────┐
                           │        POSTGRESQL 15+            │
                           │     (Neon — free tier)           │
                           │                                  │
                           │  10 tables, 8 enum types          │
                           │  ddl-auto: validate               │
                           └──────────────────────────────────┘
```

---

## Package Structure

```
backend/src/main/java/com/parkmaster/
├── auth/              AuthController, AuthService, AuthDtos
├── user/              User, Role, AdminUserController, AdminUserService
├── security/          JwtService, JwtAuthFilter, SecurityConfig
├── common/            ApiException, GlobalExceptionHandler (RFC 7807)
├── parking/           ParkingBuilding, Floor, ParkingSlot, SlotStatus
│                      ParkingService, ManagerBuildingController, ParkingDtos
├── pricing/           VehicleType, PricingPolicy, PricingService
│                      ManagerPricingController, PricingDtos
├── session/           ParkingSession, SessionStatus, ParkingSessionService
│                      SlotAllocationService, ChargeCalculator, QrCodeGenerator
│                      StaffSessionController, StaffLookupController
│                      DriverSessionController, SessionDtos
├── reservation/       Reservation, ReservationStatus, ReservationService
│                      DriverReservationController, ReservationDtos
├── payment/           Payment, PaymentStatus, PaymentMethod, PaymentService
│                      StaffPaymentController, DriverPaymentController, PaymentDtos
├── exceptionreport/   ExceptionReport, ExceptionType, ExceptionStatus
│                      ExceptionReportService, StaffExceptionController, ExceptionDtos
├── report/            ReportService, ManagerReportController, ReportDtos
└── publicapi/         PublicController

frontend/src/
├── components/        AppLayout, DriverLayout, ui.jsx, charts.jsx, AllocationShowcase
├── lib/               api.js (fetch wrapper), endpoints.js (per-role API), status.js
├── pages/
│   ├── auth/          LoginPage, SignUpPage, AuthShell
│   ├── public/        LandingPage
│   ├── system/        OverviewPage, AnalyticsPage, BuildingsPage, PricingPage, UsersPage
│   ├── staff/         CheckInPage, ActiveSessionsPage, PaymentsPage, ExceptionsPage
│   └── user/          MyParkingPage, MySessionsPage, ReservationsPage
└── routes/            ProtectedRoute
```

---

## Data Flow: Check-in with AI Allocation

```
Staff UI                    Backend                         DB
  │                           │                              │
  │  POST /check-in           │                              │
  │  {plate, vehicleTypeId,   │                              │
  │   buildingId}             │                              │
  │──────────────────────────▶│                              │
  │                           │  SlotAllocationService       │
  │                           │  .allocate(buildingId, vtId) │
  │                           │──────────────────────────────▶│
  │                           │  SELECT slots WHERE           │
  │                           │  status=AVAILABLE             │
  │                           │◀──────────────────────────────│
  │                           │                              │
  │                           │  Score each slot:            │
  │                           │  typeMatch + loadBal         │
  │                           │  + distance + peak           │
  │                           │  Pick max score              │
  │                           │                              │
  │                           │  UPDATE slot SET             │
  │                           │  status=OCCUPIED             │
  │                           │──────────────────────────────▶│
  │                           │  INSERT parking_session      │
  │                           │──────────────────────────────▶│
  │                           │                              │
  │  {id, plate, slotId,      │                              │
  │   ticketCode, status,     │                              │
  │   autoAllocated: true}    │                              │
  │◀──────────────────────────│                              │
```

---

## Data Flow: Check-out + Payment

Two phases. The slot is NOT freed at check-out — it stays OCCUPIED until the
charge is settled, so the AI allocator cannot hand it out while the car is
still physically at the payment booth.

```
Staff UI                    Backend                         DB
  │                           │                              │
  │  POST /{id}/check-out     │                              │
  │──────────────────────────▶│                              │
  │                           │  ChargeCalculator            │
  │                           │  .charge(session, policy)    │
  │                           │  → amount (grace + cap)      │
  │                           │                              │
  │                           │  UPDATE session SET          │
  │                           │  status=AWAITING_PAYMENT,    │
  │                           │  check_out_at, amount        │
  │                           │  (slot stays OCCUPIED)       │
  │                           │──────────────────────────────▶│
  │                           │  INSERT payment              │
  │                           │  (status=PENDING)            │
  │                           │──────────────────────────────▶│
  │  {session + charge info}  │                              │
  │◀──────────────────────────│                              │
  │                           │                              │
  │  POST /payments/{id}/settle (cash) — or driver pays ONLINE │
  │──────────────────────────▶│                              │
  │                           │  UPDATE payment SET          │
  │                           │  status=PAID,                │
  │                           │  processed_by_staff_id       │
  │                           │──────────────────────────────▶│
  │                           │  UPDATE session COMPLETED,   │
  │                           │  UPDATE slot AVAILABLE        │
  │                           │──────────────────────────────▶│
  │◀──────────────────────────│                              │
```

A zero-charge (free) exit skips the waiting state: the payment auto-settles and
the session completes with the slot freed immediately. A voided charge (waived
at the booth) also completes the session and frees the slot.

---

## Deployment

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│              │        │              │        │              │
│   VERCEL     │  API   │   RENDER     │  JDBC  │    NEON      │
│              │───────▶│              │───────▶│              │
│  Static SPA  │        │ Spring Boot  │        │  PostgreSQL  │
│  CDN edge    │        │ Docker/JAR   │        │  Serverless  │
│  Free tier   │        │ Free tier    │        │  Free tier   │
│              │        │              │        │              │
└──────────────┘        └──────────────┘        └──────────────┘

ENV:
  Frontend: VITE_API_URL=https://parkmaster-api.onrender.com
  Backend:  DATABASE_URL=postgresql://...@neon.tech/parkmaster
            JWT_SECRET=<secret>
            CORS_ORIGINS=https://parkmaster.vercel.app
```

---

## Security Context

- **Stateless JWT auth.** The access token is a signed JWT (HS256, 256-bit
  secret from `PARKMASTER_JWT_SECRET`). No server session state; every request
  carries `Authorization: Bearer <token>`. `JwtAuthFilter` validates and sets
  the role; `SecurityConfig` routes `/api/{admin,manager,staff,driver}/**` by
  role.
- **Token storage.** The frontend keeps the token in `localStorage`. The XSS
  exposure this implies is mitigated by a strict Content-Security-Policy and by
  sanitizing any user-rendered HTML with DOMPurify, so injected script cannot
  read storage. Tokens are short-lived (TTL via `PARKMASTER_JWT_TTL`) and the
  client force-logs-out after 15 min of inactivity.
- **Production upgrade path.** Move the token to an `HttpOnly`, `Secure`,
  `SameSite=Strict` cookie so it is unreachable from JavaScript entirely; pair
  with a CSRF token. Identified as the next hardening step, not required for the
  demo.
- **Other boundaries.** Passwords are BCrypt-hashed; input is bean-validated at
  the DTO layer; ownership is enforced server-side (a driver fetching another
  driver's session/payment gets 404, never a leak); CORS is locked to the
  configured `FRONTEND_ORIGIN`.
