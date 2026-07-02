# ParkMaster — Report Facts (Single Source of Truth)

Generated from live codebase state (backend Java/Spring Boot, frontend React,
Flyway migrations, ERD). All later report documents (SRS, SDS, Final Release,
AI Usage) must reuse the exact IDs and names defined here — do not re-derive.

Sources read: `CLAUDE.md`, `backend/src/main/java/com/parkmaster/**`,
`backend/src/main/resources/db/migration/V*.sql`, `docs/erd/erd.md`,
`frontend/src/pages/**`, `frontend/src/App.jsx`, `frontend/src/routes/ProtectedRoute.jsx`,
`backend/src/main/java/com/parkmaster/security/SecurityConfig.java`,
`docs/features/*.md`.

---

## 1. Actors

| Actor | Description |
|---|---|
| `ADMIN` | Full system access: user management, role assignment, plus everything MANAGER and STAFF can do. |
| `MANAGER` | Building/floor/slot CRUD, pricing, monthly passes, feedback, exceptions, analytics/reports, plus everything STAFF can do. |
| `STAFF` | Check-in/check-out vehicles, settle/void payments, handle exception reports, look up sessions/passes. |
| `USER` (Driver) | Reserve slots, track own sessions, pay, manage own monthly passes, submit feedback, manage own profile. |
| Guest (no auth) | Browse landing page, public pricing, building/slot availability, use AI chat assistant, register/login. |
| VNPay (external) | Third-party payment gateway for `ONLINE`/VNPAY payment method; redirects back via `GET /api/public/payments/vnpay-return`. |
| Google Gemini (external) | Optional LLM backing the AI chat assistant (`POST /api/public/assistant/chat`); backend falls back to local FAQ if unconfigured/unreachable. |

---

## 2. Use-Case List

IDs are stable — cited verbatim by SRS/SDS.

| UC-ID | Feature | Use Case | Description |
|---|---|---|---|
| UC-1 | Auth | Register | Driver self-registers with email/password. |
| UC-2 | Auth | Login | Any role logs in, receives JWT. |
| UC-3 | Auth | Forgot Password | Request password reset token by email. |
| UC-4 | Auth | Reset Password | Set new password using reset token. |
| UC-5 | Parking Mgmt | Manage Buildings | Manager creates/updates/deletes parking buildings. |
| UC-6 | Parking Mgmt | Manage Floors | Manager creates/deletes floors, assigns floor to a vehicle type. |
| UC-7 | Parking Mgmt | Manage Slots | Manager creates/deletes slots, updates slot status. |
| UC-8 | Parking Mgmt | View Allocation Analytics | Manager views per-building AI allocation analytics. |
| UC-9 | Parking Mgmt | View Building/Slot Availability | Guest/driver views live availability (public). |
| UC-10 | Pricing | Manage Vehicle Types | Manager creates/updates/deletes vehicle types. |
| UC-11 | Pricing | Manage Pricing Policy | Manager sets rate/hour, daily cap, grace period, peak multiplier per vehicle type. |
| UC-12 | Pricing | View Public Pricing | Guest views current pricing table. |
| UC-13 | Session | Check-In Vehicle | Staff checks in a vehicle; AI `SlotAllocationService` auto-allocates a slot. |
| UC-14 | Session | Check-Out Vehicle | Staff checks out a vehicle; `ChargeCalculator` computes amount due. |
| UC-15 | Session | Look Up Session | Staff looks up a session by plate or ticket code. |
| UC-16 | Session | View Active Sessions | Staff views all currently active sessions. |
| UC-17 | Session | View My Sessions | Driver views own session history/status. |
| UC-18 | Session | Estimate Charge | Driver previews current accrued charge for an active session. |
| UC-19 | Reservation | Reserve Slot | Driver reserves a slot (free or paid), with AI-suggested slot. |
| UC-20 | Reservation | Cancel Reservation | Driver cancels a pending reservation. |
| UC-21 | Reservation | View Reservation QR | Driver retrieves QR code for a reservation. |
| UC-22 | Payment | Pay for Session | Driver pays online or via VNPay. |
| UC-23 | Payment | Settle/Void Payment | Staff settles a cash payment or voids a payment. |
| UC-24 | Payment | View Pending Payments | Staff views payments awaiting settlement. |
| UC-25 | Payment | View Revenue Report | Manager views revenue summary. |
| UC-26 | Exception | Report Exception | Staff/driver reports lost ticket, wrong plate, overtime, or wrong zone. |
| UC-27 | Exception | Resolve Exception | Staff/manager resolves an open exception report. |
| UC-28 | Exception | View Open Exceptions | Staff/manager views the open-exception queue. |
| UC-29 | Monthly Pass | Purchase Monthly Pass | Driver purchases a monthly pass (paid via VNPay). |
| UC-30 | Monthly Pass | Activate Pass | Manager activates a pending pass. |
| UC-31 | Monthly Pass | Revoke Pass | Manager deletes/revokes a pass. |
| UC-32 | Monthly Pass | Look Up Pass at Checkout | Staff looks up an active pass by plate to zero out checkout charge. |
| UC-33 | Feedback | Submit Feedback | Driver rates/comments on a completed session. |
| UC-34 | Feedback | View Feedback | Manager views submitted feedback. |
| UC-35 | User Mgmt | Manage User Roles | Admin changes a user's role. |
| UC-36 | User Mgmt | Activate/Deactivate User | Admin enables/disables a user account. |
| UC-37 | Analytics | View Revenue (Daily) | Manager views daily revenue trend. |
| UC-38 | Analytics | View Check-ins by Hour | Manager views peak-hour check-in distribution. |
| UC-39 | Analytics | View Duration by Vehicle Type | Manager views average session duration per vehicle type. |
| UC-40 | Analytics | View Allocation Comparison | Manager compares AI auto-allocation vs free choice (answers RQ2–RQ4). |
| UC-41 | AI Assistant | Chat with AI Assistant | Guest/any user asks parking questions; answered via Gemini or local FAQ fallback. |
| UC-42 | Account | Manage Own Profile | Driver updates profile / changes password. |

---

## 3. Screen List

| # | Feature | Screen (component) | Description |
|---|---|---|---|
| 1 | Public | `public/LandingPage.jsx` | Guest landing/marketing page (SEO). |
| 2 | Public | `public/PricingPage.jsx` | Guest-facing pricing table. |
| 3 | Auth | `auth/LoginPage.jsx` | Login form. |
| 4 | Auth | `auth/SignUpPage.jsx` | Driver registration form. |
| 5 | Auth | `auth/ForgotPasswordPage.jsx` | Request password reset. |
| 6 | Auth | `auth/ResetPasswordPage.jsx` | Set new password via token. |
| 7 | Staff | `staff/CheckInPage.jsx` | Check-in vehicle (AI auto-allocate slot); also STAFF home. |
| 8 | Staff | `staff/ActiveSessionsPage.jsx` | List/manage currently active sessions; check-out entry point. |
| 9 | Staff | `staff/ExceptionsPage.jsx` | Staff exception report queue. |
| 10 | Staff | `staff/PaymentsPage.jsx` | Pending payments, settle/void. |
| 11 | Manager/Admin | `system/BuildingsPage.jsx` | Building/floor/slot CRUD. |
| 12 | Manager/Admin | `system/PricingPage.jsx` | Vehicle type + pricing policy CRUD. |
| 13 | Admin | `system/UsersPage.jsx` | User list, role assignment, activate/deactivate. |
| 14 | Manager/Admin | `system/AnalyticsPage.jsx` | Revenue, check-in, duration, allocation-comparison charts. |
| 15 | Manager/Admin | `system/MonthlyPassesPage.jsx` | Monthly pass list, activate/revoke. |
| 16 | Manager/Admin | `system/FeedbackPage.jsx` | Submitted driver feedback list. |
| 17 | Manager/Admin | `system/ExceptionsPage.jsx` | Manager exception queue/resolve. |
| 18 | Manager | `system/OverviewPage.jsx` | MANAGER home dashboard. |
| 19 | Admin | `system/AdminOverviewPage.jsx` | ADMIN home dashboard. |
| 20 | Driver | `user/MyParkingPage.jsx` | USER home: current parking status. |
| 21 | Driver | `user/MySessionsPage.jsx` | Driver session history. |
| 22 | Driver | `user/ReservationsPage.jsx` | Reserve/cancel/view reservation QR. |
| 23 | Driver | `user/PassesPage.jsx` | Purchase/view own monthly passes. |
| 24 | Driver | `user/AccountPage.jsx` | Profile + change password. |

Note: `frontend/src/routes/ProtectedRoute.jsx` only gates the `/app/*` subtree
to the four authenticated roles as a group (`allow=["ADMIN","MANAGER","STAFF","USER"]`);
it does not restrict individual pages by role. Per-screen authorization is
enforced by the **backend** API role checks (see §4), which each page's data
calls depend on.

---

## 4. Screen Authorization Matrix (API authorization by role)

This is an **API-authorization** matrix, not a frontend-navigation matrix. It is
derived from `backend/src/main/java/com/parkmaster/security/SecurityConfig.java`:
`/api/admin/**` → `ADMIN`; `/api/manager/**` → `ADMIN, MANAGER`; `/api/staff/**`
→ `ADMIN, MANAGER, STAFF`; `/api/driver/**` → `ADMIN, USER`; `/api/public/**`
and `/api/auth/**` → no auth required. There are **no** `@PreAuthorize`
annotations; these URL-prefix rules are the entire RBAC boundary. Object
ownership (a driver seeing only their own sessions/passes/reservations) is
enforced in the service layer, e.g. `ParkingSessionService.getForUser(email, id)`.

The frontend does **not** gate screens per role: all four authenticated roles
share one `ProtectedRoute` over `/app/*` (`frontend/src/App.jsx`), so any signed-in
user can open any route; unauthorized data calls just return `403`. Each row below
therefore lists the roles the screen's backing API accepts — `X` marks accepted.

| Screen | ADMIN | MANAGER | STAFF | USER | Guest |
|---|:---:|:---:|:---:|:---:|:---:|
| LandingPage / public PricingPage | | | | | X |
| Login / SignUp / Forgot / Reset Password | | | | | X |
| CheckInPage | X | X | X | | |
| ActiveSessionsPage | X | X | X | | |
| Staff ExceptionsPage | X | X | X | | |
| Staff PaymentsPage | X | X | X | | |
| BuildingsPage | X | X | | | |
| System PricingPage | X | X | | | |
| UsersPage | X | | | | |
| AnalyticsPage | X | X | | | |
| MonthlyPassesPage | X | X | | | |
| System FeedbackPage | X | X | | | |
| Manager ExceptionsPage | X | X | | | |
| OverviewPage | X | X | | | |
| AdminOverviewPage | X | | | | |
| MyParkingPage | X | | | X | |
| MySessionsPage | X | | | X | |
| ReservationsPage | X | | | X | |
| PassesPage (driver) | X | | | X | |
| AccountPage | X | | | X | |

(`ADMIN` is a superset of `MANAGER`+`STAFF`+`USER` by the security rules above,
so it is marked `X` everywhere an authenticated role is required.)

---

## 5. Non-UI Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/public/health` | Health check; polled by UptimeRobot every 14 min to prevent Render spin-down. |
| `GET /api/public/payments/vnpay-return` | VNPay redirect/callback after gateway payment. |
| `POST /api/public/assistant/chat` | AI assistant chat; calls Google Gemini server-side (JDK `HttpClient`), rate-limited per IP, falls back to local FAQ. |
| Dev seeder (`com.parkmaster.dev`) | Seeds 2 buildings, 6 floors, 86 slots, 5 active sessions, 30 days of historical data when `SPRING_PROFILES_ACTIVE=dev`. |

---

## 6. Database Tables

Reused verbatim from `docs/erd/erd.md` (13 tables, Flyway `V1`–`V23`):

| # | Table | PK | Key FKs |
|---|---|---|---|
| 1 | `users` | `id` | — |
| 2 | `parking_building` | `id` | — |
| 3 | `floor` | `id` | `building_id`→parking_building, `vehicle_type_id`→vehicle_type |
| 4 | `parking_slot` | `id` | `floor_id`→floor |
| 5 | `vehicle_type` | `id` | — |
| 6 | `pricing_policy` | `id` | `vehicle_type_id`→vehicle_type (unique) |
| 7 | `parking_session` | `id` | `user_id`→users, `slot_id`→parking_slot, `vehicle_type_id`→vehicle_type |
| 8 | `payment` | `id` | `session_id`→parking_session (unique), `processed_by_staff_id`→users |
| 9 | `reservation` | `id` | `user_id`→users, `slot_id`→parking_slot, `vehicle_type_id`→vehicle_type, `building_id`→parking_building, `deposit_payment_id`→payment |
| 10 | `exception_report` | `id` | `session_id`→parking_session, `reported_by`→users |
| 11 | `monthly_pass` | `id` | `user_id`→users, `vehicle_type_id`→vehicle_type, `payment_id`→payment |
| 12 | `feedback` | `id` | `session_id`→parking_session (unique), `user_id`→users |
| 13 | `password_reset_token` | `id` | `user_id`→users |

Full ERD diagram, enum values, and constraints: see `docs/erd/erd.md` — do not
regenerate; embed/reference it directly in SRS/SDS.

---

## 7. Code Packages (`com.parkmaster.*`)

| Package | Responsibility |
|---|---|
| `assistant` | AI chat assistant controller/service (Gemini integration + local FAQ fallback). |
| `auth` | Register/login, JWT issuance, password reset. |
| `common` | `ApiException`, `GlobalExceptionHandler` (RFC7807 errors). |
| `dev` | Dev-profile data seeder. |
| `exceptionreport` | Exception report entity, staff/manager controllers, resolve flow. |
| `feedback` | Feedback entity, driver submit + manager view controllers. |
| `parking` | `ParkingBuilding`, `Floor`, `ParkingSlot` entities + manager CRUD controller. |
| `pass` | Monthly pass entity, driver purchase + manager activate/revoke controllers. |
| `payment` | `Payment` entity, driver/staff/manager/public controllers, VNPay integration. |
| `pricing` | `VehicleType`, `PricingPolicy` entities + manager controller. |
| `publicapi` | Public (no-auth) controller: health, availability, public pricing. |
| `report` | Manager analytics/report controller (revenue, check-ins, duration, allocation comparison). |
| `reservation` | `Reservation` entity, driver controller, AI slot suggestion. |
| `security` | `JwtService`, `JwtAuthFilter`, `SecurityConfig` (role-based `/api/**` routing). |
| `session` | `ParkingSession` entity, `ChargeCalculator`, `SlotAllocationService`, staff/driver controllers. |
| `user` | `User`, `Role`, repo, admin user-management controller, driver profile controller. |

---

## Acceptance self-check

- [x] Every actor referenced (5 roles + Guest + VNPay + Google Gemini) appears in §1.
- [x] All UC IDs assigned here (UC-1..UC-42); later docs must cite these exact IDs.
- [x] Every screen under `frontend/src/pages/{auth,public,system,user,staff}` listed in §3.
- [x] Authorization matrix in §4 covers all 5 roles for every screen, derived from `SecurityConfig.java`.
- [x] No invented features — every row traced to an existing controller, page, or migration file.
