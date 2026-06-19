# Software Requirements Specification — ParkMaster

**Project:** Parking Building Management System
**Course:** SWP391 — FPT University
**Version:** 1.0
**Date:** 2026-06-19

---

## 1. Introduction

### 1.1 Purpose

This SRS defines functional and non-functional requirements for ParkMaster, a web-based parking building management system. It serves as the contract between the development team and the SWP391 instructors for grading and evaluation.

### 1.2 Scope

ParkMaster manages multi-story parking buildings: infrastructure setup, real-time slot tracking, vehicle check-in/out, automated slot allocation via AI scoring, reservations, payments, exception handling, and operational analytics. The system serves five actor types across a role-based access model.

### 1.3 Definitions and Acronyms

| Term | Definition |
|---|---|
| Slot | A single parking space within a floor |
| Session | A check-in to check-out lifecycle for one vehicle |
| Reservation | A pre-booked slot hold with 30-minute expiry |
| AI Allocation | Weighted scoring algorithm that auto-assigns optimal slots |
| RQ | Research Question (RBL component) |
| JWT | JSON Web Token — stateless authentication |
| ERD | Entity-Relationship Diagram |

### 1.4 References

- [User Flows](user-flows.md)
- [Use Cases](use-cases.md)
- [ERD](erd.md)
- [Feature Notes](features/)

---

## 2. Overall Description

### 2.1 Product Perspective

ParkMaster is a standalone web application with:
- **Frontend:** React 19 SPA served by Vite, styled with Tailwind CSS v4
- **Backend:** Spring Boot 3 REST API with PostgreSQL
- **Auth:** Stateless JWT, role-based endpoint security
- **Deploy target:** Vercel (frontend) + Render (backend) + Neon (PostgreSQL)

### 2.2 Product Functions (high-level)

| # | Function | Primary actor |
|---|---|---|
| F1 | User registration and authentication | All |
| F2 | Building / floor / slot infrastructure management | Manager |
| F3 | Vehicle type and pricing policy management | Manager |
| F4 | Vehicle check-in with AI auto-allocation or manual pick | Staff |
| F5 | Vehicle check-out with automatic charge calculation | Staff |
| F6 | Slot reservation with AI allocation and 30-min hold | Driver |
| F7 | Payment settlement (cash/card/online) and void | Staff, Driver |
| F8 | Exception reporting and resolution | Staff |
| F9 | Operational analytics and reports | Manager |
| F10 | User account and role management | Admin |
| F11 | Public availability and pricing view (SEO) | Guest |
| F12 | AI allocation score transparency (research demo) | Guest |

### 2.3 User Classes and Characteristics

| Actor | Description | Technical level |
|---|---|---|
| Guest | Unauthenticated visitor | Low — browsing only |
| Driver | Registered vehicle owner | Low — mobile-first usage |
| Staff | Gate operator at parking entrance/exit | Medium — trained on system |
| Manager | Building administrator | Medium — needs analytics literacy |
| Admin | System administrator | High — manages all accounts |

### 2.4 Operating Environment

- Browser: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile: responsive layout (target 360px+)
- Server: JDK 21+, PostgreSQL 15+
- No native mobile app; web-only

### 2.5 Constraints

- SWP391 capstone scope — demo-scale, not production-scale
- Free-tier deployment (Vercel, Render, Neon)
- No real payment gateway integration (simulated)
- No hardware integration (QR scanning via screen display)

---

## 3. Functional Requirements

### 3.1 Authentication (F1)

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Guest can register with email, password (min 8 chars), full name | Must |
| FR-1.2 | Registration assigns USER role by default | Must |
| FR-1.3 | User can login with email + password, receives JWT | Must |
| FR-1.4 | JWT stored client-side, attached as Bearer token to all API calls | Must |
| FR-1.5 | Auto-logout after 15 minutes of inactivity | Should |
| FR-1.6 | Deactivated accounts cannot login | Must |

### 3.2 Building Infrastructure Management (F2)

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Manager can CRUD parking buildings (name, address) | Must |
| FR-2.2 | Manager can CRUD floors within a building (level, name) | Must |
| FR-2.3 | Manager can assign a vehicle type to a floor (for allocation scoring) | Should |
| FR-2.4 | Manager can CRUD slots within a floor (code) | Must |
| FR-2.5 | Manager can set slot status: AVAILABLE, MAINTENANCE, LOCKED | Must |
| FR-2.6 | Floor level must be unique within a building | Must |
| FR-2.7 | Slot code must be unique within a floor | Must |

### 3.3 Vehicle Type and Pricing (F3)

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Manager can CRUD vehicle types (e.g., Car, Motorcycle, Truck) | Must |
| FR-3.2 | Manager can set pricing policy per vehicle type: hourly rate, grace minutes, daily cap | Must |
| FR-3.3 | One pricing policy per vehicle type (1:1 unique constraint) | Must |
| FR-3.4 | Pricing supports peak-hour multiplier | Should |
| FR-3.5 | Pricing visible to public (guest) without authentication | Must |

### 3.4 Check-in (F4)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Staff can check in a vehicle by entering license plate + vehicle type | Must |
| FR-4.2 | Auto-allocate mode: system selects best slot via AI scoring algorithm | Must |
| FR-4.3 | Manual mode: staff selects building → floor → available slot | Must |
| FR-4.4 | Check-in creates active session, slot status → OCCUPIED | Must |
| FR-4.5 | Unique ticket code (UUID) generated per session | Must |
| FR-4.6 | Ticket QR code rendered as PNG, accessible via authenticated endpoint | Should |
| FR-4.7 | If vehicle has pending reservation, check-in matches against it | Should |

### 3.5 Check-out (F5)

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Staff can check out by session ID or ticket code scan | Must |
| FR-5.2 | Charge calculated: hourly rate x duration | Must |
| FR-5.3 | Grace period: no charge if duration under grace minutes | Must |
| FR-5.4 | Daily cap: charge capped at maximum per day | Must |
| FR-5.5 | Session status → COMPLETED, slot status → AVAILABLE | Must |
| FR-5.6 | Payment record created automatically (status PENDING) | Must |

### 3.6 Reservation (F6)

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Driver can reserve a slot by selecting building + vehicle type + license plate | Must |
| FR-6.2 | System auto-allocates best slot via AI scoring | Must |
| FR-6.3 | Slot status → RESERVED, reservation status PENDING | Must |
| FR-6.4 | Reservation held for 30 minutes | Must |
| FR-6.5 | Driver can cancel pending reservation | Must |
| FR-6.6 | Expired reservations release the slot automatically | Should |

### 3.7 Payment (F7)

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Staff can view pending payments list | Must |
| FR-7.2 | Staff can settle payment with method: CASH, CARD, or ONLINE | Must |
| FR-7.3 | Staff can void payment with reason | Must |
| FR-7.4 | Driver can view own pending payments | Must |
| FR-7.5 | Driver can pay online (simulated) | Must |
| FR-7.6 | Payment status transitions: PENDING → SETTLED or PENDING → VOIDED | Must |

### 3.8 Exception Handling (F8)

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Staff can report exception: type + description + optional session link | Must |
| FR-8.2 | Exception types: LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE | Must |
| FR-8.3 | Staff can view open exceptions | Must |
| FR-8.4 | Staff can resolve exception with resolution note | Must |

### 3.9 Analytics and Reports (F9)

| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Manager overview dashboard: building count, slot count, active sessions, revenue | Must |
| FR-9.2 | Revenue daily trend chart (date range filter) | Must |
| FR-9.3 | Revenue by vehicle type chart | Must |
| FR-9.4 | Check-ins by hour-of-day chart | Must |
| FR-9.5 | Average session duration by vehicle type chart | Should |
| FR-9.6 | Auto vs manual allocation comparison chart (answers RQ2) | Must |
| FR-9.7 | Floor fill-rate analytics | Should |

### 3.10 User Management (F10)

| ID | Requirement | Priority |
|---|---|---|
| FR-10.1 | Admin can list all users | Must |
| FR-10.2 | Admin can create user with role assignment | Must |
| FR-10.3 | Admin can change user role | Must |
| FR-10.4 | Admin can deactivate/reactivate user | Must |

### 3.11 Public View (F11, F12)

| ID | Requirement | Priority |
|---|---|---|
| FR-11.1 | Guest can view building list and slot availability without auth | Must |
| FR-11.2 | Guest can view pricing per vehicle type without auth | Must |
| FR-11.3 | Landing page shows live slot map preview | Should |
| FR-11.4 | Landing page shows AI allocation score breakdown (research demo) | Must |
| FR-11.5 | Allocation preview shows per-criterion scores: vehicle type match, load balance, distance, peak hour | Must |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|---|---|
| NFR-1 | API response time < 500ms for standard CRUD operations |
| NFR-2 | AI allocation scoring completes in < 200ms for buildings with up to 500 slots |
| NFR-3 | Frontend initial load (LCP) < 3 seconds on 4G connection |

### 4.2 Security

| ID | Requirement |
|---|---|
| NFR-4 | Passwords hashed with BCrypt |
| NFR-5 | All authenticated endpoints require valid JWT |
| NFR-6 | Role-based access control enforced at API level (Spring Security) |
| NFR-7 | CORS configured with explicit allowed origins |
| NFR-8 | No secrets in source code or client-side storage (except JWT token) |
| NFR-9 | SQL injection prevented via parameterized queries (JPA/Hibernate) |

### 4.3 Reliability

| ID | Requirement |
|---|---|
| NFR-10 | Database schema versioned via Flyway migrations |
| NFR-11 | Concurrent slot allocation handled with optimistic locking |
| NFR-12 | API errors return RFC 7807 problem details |

### 4.4 Usability

| ID | Requirement |
|---|---|
| NFR-13 | Responsive layout: functional on 360px–1920px viewports |
| NFR-14 | Dark mode support via system preference |
| NFR-15 | Role-appropriate navigation: each role sees only relevant menu items |
| NFR-16 | Form validation with inline error messages |

### 4.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-17 | Backend follows layered architecture: Controller → Service → Repository |
| NFR-18 | Domain packages isolated: auth, parking, pricing, session, reservation, payment, exceptionreport |
| NFR-19 | Unit tests for business logic (charge calculation, allocation scoring) |

---

## 5. AI Slot Allocation — Key Feature

Priority feature for grading. Answers research questions RQ2–RQ4.

### 5.1 Algorithm

Weighted scoring model. Each available slot scored:

```
score = vehicleTypeMatch(40) + loadBalance(30) + distanceToEntry(20) + peakHour(10)
```

| Criterion | Weight | Logic |
|---|---|---|
| Vehicle type match | 40 | Floor assigned to this type → 40; mixed → 20; wrong → 0 |
| Load balance | 30 | `availableRatio * 30` — favors emptier floors |
| Distance to entry | 20 | `20 / floor.level` — lower floors score higher |
| Peak hour bonus | 10 | During peak: `availableRatio * 10` — extra spread |

### 5.2 Usage Points

- **Check-in** (auto mode): staff omits slot → system picks best
- **Reservation**: driver picks building + type → system picks best slot and holds it

### 5.3 Transparency

- Public endpoint exposes top-N candidates with full score breakdown
- Landing page renders live showcase for demo/presentation
- Analytics page compares auto vs manual allocation outcomes

### 5.4 Research Question Mapping

| RQ | How system answers it |
|---|---|
| RQ1: Floor/zone segmentation effect on utilization | Floor vehicle-type assignment + fill-rate analytics |
| RQ2: Auto allocation vs free choice time-to-park | Auto vs manual comparison report |
| RQ3: Which criteria matter most | Score breakdown transparency — weight impact visible |
| RQ4: Peak-hour utilization improvement | Peak-hour bonus criterion + check-ins-by-hour report |

---

## 6. Data Model

See [ERD](erd.md) for full entity-relationship diagram.

**10 entities:** User, VehicleType, PricingPolicy, ParkingBuilding, Floor, ParkingSlot, ParkingSession, Reservation, Payment, ExceptionReport.

**8 enums:** Role, SlotStatus, SessionStatus, ReservationStatus, PaymentStatus, PaymentMethod, ExceptionType, ExceptionStatus.

---

## 7. API Design

REST API organized by role-based path prefix:

| Prefix | Access | Purpose |
|---|---|---|
| `/api/auth/**` | Public | Register, login |
| `/api/public/**` | Public | Buildings, availability, pricing, allocation preview |
| `/api/driver/**` | USER role | Sessions, payments, reservations |
| `/api/staff/**` | STAFF+ | Check-in/out, payments, exceptions, lookups |
| `/api/manager/**` | MANAGER+ | Building CRUD, pricing, reports |
| `/api/admin/**` | ADMIN | User management |

Role hierarchy: ADMIN > MANAGER > STAFF (each includes lower access). USER (Driver) is separate.

---

## 8. Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend framework | Spring Boot 3.3 |
| Language | Java 21 |
| Build tool | Maven (mvnd) |
| Database | PostgreSQL 15+ |
| ORM | Spring Data JPA / Hibernate |
| Migration | Flyway |
| Auth | JWT (jjwt library) |
| Security | Spring Security |
| Password hashing | BCrypt |
| QR generation | ZXing |

---

## 9. Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel     │────▶│   Render     │────▶│    Neon      │
│  (Frontend)  │     │  (Backend)   │     │ (PostgreSQL) │
│  React SPA   │ API │ Spring Boot  │ JDBC│  Free tier   │
│  Static CDN  │     │  Port 5000   │     │              │
└─────────────┘     └──────────────┘     └─────────────┘
```

All free-tier. Frontend sets `VITE_API_URL` to Render backend URL.

---

## 10. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| AC-1 | All 5 roles can login and see role-appropriate dashboard | Manual test |
| AC-2 | Manager can create building → floor → slot hierarchy | Manual test |
| AC-3 | Staff auto-allocate check-in assigns optimal slot | Manual test + allocation preview |
| AC-4 | Driver can reserve and cancel | Manual test |
| AC-5 | Check-out calculates correct charge (grace + cap) | Unit test + manual |
| AC-6 | Payment settle/void works for staff and driver | Manual test |
| AC-7 | Exception report + resolve workflow complete | Manual test |
| AC-8 | Analytics charts render with real data | Manual test |
| AC-9 | AI allocation score breakdown visible on landing page | Manual test |
| AC-10 | Application deploys and runs on free-tier infrastructure | Deploy test |
