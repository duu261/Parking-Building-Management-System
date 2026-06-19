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

```
Staff UI                    Backend                         DB
  │                           │                              │
  │  POST /{id}/check-out     │                              │
  │──────────────────────────▶│                              │
  │                           │  ChargeCalculator            │
  │                           │  .calculate(session, policy) │
  │                           │  → amount (grace + cap)      │
  │                           │                              │
  │                           │  UPDATE session SET          │
  │                           │  status=COMPLETED,           │
  │                           │  check_out_at, amount        │
  │                           │──────────────────────────────▶│
  │                           │  UPDATE slot SET             │
  │                           │  status=AVAILABLE            │
  │                           │──────────────────────────────▶│
  │                           │  INSERT payment              │
  │                           │  (status=PENDING)            │
  │                           │──────────────────────────────▶│
  │                           │                              │
  │  {session + charge info}  │                              │
  │◀──────────────────────────│                              │
```

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
