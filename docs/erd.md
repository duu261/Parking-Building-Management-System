# Entity-Relationship Diagram (ERD) — ParkMaster

**Last updated:** 2026-06-30

This document defines all JPA entities, their fields, relationships, and enumerations in the ParkMaster parking building management system.

## Entities Overview

| Entity | Table | Purpose |
|--------|-------|---------|
| **User** | `users` | User accounts with roles (ADMIN, MANAGER, STAFF, USER) |
| **PasswordResetToken** | `password_reset_token` | Password reset flow audit trail |
| **ParkingBuilding** | `parking_building` | Top-level building entity |
| **Floor** | `floor` | Floors within a building, optionally segmented by vehicle type |
| **ParkingSlot** | `parking_slot` | Individual parking slots with allocation status |
| **VehicleType** | `vehicle_type` | Vehicle type catalog (e.g., Car, Motorcycle) |
| **PricingPolicy** | `pricing_policy` | Tariff per vehicle type (rate/hour, grace minutes, daily cap, peak multiplier) |
| **ParkingSession** | `parking_session` | Check-in to check-out session (or staff walk-in) |
| **Reservation** | `reservation` | Pre-booking a slot for a future time window |
| **Payment** | `payment` | Payment record per session (CASH/ONLINE/VNPAY) |
| **ExceptionReport** | `exception_report` | Lost ticket, wrong plate, overtime, wrong zone reports |
| **MonthlyPass** | `monthly_pass` | Unlimited monthly passes per vehicle type |
| **Feedback** | `feedback` | Driver feedback (rating + comment) per session |

---

## Entity Details

### User

**Table:** `users`  
**Purpose:** User accounts and authentication

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Login credential |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Bcrypt hash, never plaintext |
| `full_name` | `VARCHAR(255)` | NOT NULL | Display name |
| `role` | `VARCHAR(255)` enum | NOT NULL | `ADMIN`, `MANAGER`, `STAFF`, `USER` |
| `active` | `BOOLEAN` | NOT NULL, default=true | Soft-delete flag |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Account creation timestamp |

**Relationships:**
- 1:N ← PasswordResetToken (user_id)
- 1:N ← ParkingSession (user_id, nullable)
- 1:N ← Reservation (user_id)
- 1:N ← Payment (processed_by_staff_id, nullable)
- 1:N ← ExceptionReport (reported_by)
- 1:N ← MonthlyPass (user_id)
- 1:N ← Feedback (user_id)

---

### PasswordResetToken

**Table:** `password_reset_token`  
**Purpose:** Track password reset tokens for security audit

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `user_id` | `BIGINT` | NOT NULL, FK → users | Token owner |
| `token` | `VARCHAR(64)` | NOT NULL, UNIQUE | 64-char reset token |
| `expires_at` | `TIMESTAMP` | NOT NULL | Expiry deadline |
| `used` | `BOOLEAN` | NOT NULL, default=false | Mark used to prevent replay |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Token generation time |

**Relationships:**
- N:1 → User (user_id)

---

### ParkingBuilding

**Table:** `parking_building`  
**Purpose:** Top-level building container

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `name` | `VARCHAR(255)` | NOT NULL | Building name/identifier |
| `address` | `VARCHAR(255)` | — | Street address (nullable) |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- 1:N → Floor (building_id)

---

### Floor

**Table:** `floor`  
**Purpose:** Floors within a building; optional vehicle type segmentation

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `building_id` | `BIGINT` | NOT NULL, FK → parking_building | Parent building |
| `vehicle_type_id` | `BIGINT` | — | Optional floor specialization (nullable FK → vehicle_type) |
| `level` | `INTEGER` | NOT NULL | Floor level (e.g., 1, 2, 3, -1 for basement) |
| `name` | `VARCHAR(255)` | NOT NULL | Display name (e.g., "Level 2 - Motorcycles") |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- N:1 → ParkingBuilding (building_id)
- N:1 → VehicleType (vehicle_type_id, optional)
- 1:N → ParkingSlot (floor_id)

---

### ParkingSlot

**Table:** `parking_slot`  
**Purpose:** Individual parking spaces with allocation status

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `floor_id` | `BIGINT` | NOT NULL, FK → floor | Parent floor |
| `code` | `VARCHAR(255)` | NOT NULL | Slot identifier (e.g., "A-01", "B-15") |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=AVAILABLE | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `LOCKED` |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- N:1 → Floor (floor_id)
- 1:N ← ParkingSession (slot_id)
- 1:N ← Reservation (slot_id)

---

### VehicleType

**Table:** `vehicle_type`  
**Purpose:** Catalog of vehicle types (Car, Motorcycle, Truck, etc.)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `name` | `VARCHAR(255)` | NOT NULL, UNIQUE | Vehicle type name |
| `description` | `VARCHAR(255)` | — | Optional description (nullable) |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- 1:1 ← PricingPolicy (vehicle_type_id, unique FK)
- 1:N ← Floor (vehicle_type_id, optional)
- 1:N ← ParkingSession (vehicle_type_id)
- 1:N ← Reservation (vehicle_type_id)
- 1:N ← MonthlyPass (vehicle_type_id)

---

### PricingPolicy

**Table:** `pricing_policy`  
**Purpose:** Tariff rules per vehicle type (rate, caps, grace, peak surcharge)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `vehicle_type_id` | `BIGINT` | NOT NULL, FK → vehicle_type, UNIQUE | One active policy per vehicle type |
| `rate_per_hour` | `NUMERIC(38,2)` | NOT NULL | Base hourly rate |
| `daily_cap` | `NUMERIC(38,2)` | — | Max charge per day (nullable = uncapped) |
| `grace_minutes` | `INTEGER` | NOT NULL, default=0 | Free parking before billing starts |
| `peak_multiplier` | `NUMERIC(38,2)` | NOT NULL, default=1.00 | Surcharge factor during peak hours |
| `monthly_pass_price` | `NUMERIC(38,2)` | — | Cost of unlimited monthly pass (nullable) |
| `is_active` | `BOOLEAN` | NOT NULL, default=true | Soft-disable for retired tariffs |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- 1:1 → VehicleType (vehicle_type_id, unique)

---

### ParkingSession

**Table:** `parking_session`  
**Purpose:** Check-in to check-out or staff walk-in session; doubles as ticket

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `user_id` | `BIGINT` | — | Nullable; null for staff-handled walk-ins (no account) |
| `slot_id` | `BIGINT` | NOT NULL, FK → parking_slot | Assigned slot |
| `vehicle_type_id` | `BIGINT` | NOT NULL, FK → vehicle_type | Vehicle type for tariff lookup |
| `license_plate` | `VARCHAR(255)` | NOT NULL | License plate for enforcement |
| `ticket_code` | `VARCHAR(255)` | NOT NULL, UNIQUE | UUID encoded into QR code for checkout scan |
| `check_in_at` | `TIMESTAMP` | NOT NULL, immutable | Check-in timestamp |
| `check_out_at` | `TIMESTAMP` | — | Nullable; set on checkout |
| `amount_charged` | `NUMERIC(38,2)` | — | Nullable; set after tariff calculated |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=ACTIVE | `ACTIVE`, `AWAITING_PAYMENT`, `COMPLETED` |
| `auto_allocated` | `BOOLEAN` | NOT NULL, default=false | True if slot chosen by allocation service |
| `allocation_score` | `JSONB` | — | AI allocation scoring metadata (nullable) |
| `from_reservation` | `BOOLEAN` | NOT NULL, default=false | True if session originated from a reservation |
| `deposit_credit` | `NUMERIC(38,2)` | — | Deposit credited at checkout (PAID reservations only) |

**Relationships:**
- N:1 → User (user_id, optional)
- N:1 → ParkingSlot (slot_id)
- N:1 → VehicleType (vehicle_type_id)
- 1:1 ← Payment (session_id, optional)
- 1:N ← ExceptionReport (session_id, optional)
- 1:1 ← Feedback (session_id, unique)

---

### Reservation

**Table:** `reservation`  
**Purpose:** Pre-booking slots with two tiers: FREE (AI at check-in, 10% off) and PAID (pick slot, deposit via VNPay)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `user_id` | `BIGINT` | NOT NULL, FK → users | Reservation owner |
| `slot_id` | `BIGINT` | FK → parking_slot | Reserved slot (nullable for FREE tier) |
| `building_id` | `BIGINT` | FK → parking_building | Target building |
| `vehicle_type_id` | `BIGINT` | NOT NULL, FK → vehicle_type | Vehicle type reserved for |
| `license_plate` | `VARCHAR(255)` | NOT NULL | Expected plate (unique per PENDING status) |
| `reservation_type` | `VARCHAR(255)` | NOT NULL, default=FREE | `FREE` or `PAID` |
| `reserved_start` | `TIMESTAMP` | — | Driver's chosen arrival time |
| `hold_until` | `TIMESTAMP` | NOT NULL | 15min for unpaid PAID; reservedStart+30min after payment/FREE |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=PENDING | `PENDING`, `FULFILLED`, `CANCELLED`, `EXPIRED` |
| `deposit_amount` | `NUMERIC(38,2)` | — | 1hr rate deposit (PAID only) |
| `deposit_payment_id` | `BIGINT` | FK → payment | Linked deposit payment (PAID only) |
| `allocation_score` | `JSONB` | — | Allocation scoring metadata (nullable) |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- N:1 → User (user_id)
- N:1 → ParkingSlot (slot_id, optional)
- N:1 → ParkingBuilding (building_id)
- N:1 → VehicleType (vehicle_type_id)
- N:1 → Payment (deposit_payment_id, optional)

---

### Payment

**Table:** `payment`  
**Purpose:** Payment records for sessions, reservation deposits, and monthly passes

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `session_id` | `BIGINT` | — | FK → parking_session, UNIQUE (nullable for deposits/passes) |
| `amount` | `NUMERIC(38,2)` | NOT NULL | Total charged (base + penalty) |
| `penalty_amount` | `NUMERIC(38,2)` | NOT NULL, default=0.00 | Surcharge component |
| `description` | `VARCHAR(255)` | — | Identifies sessionless payments (e.g., "Reservation deposit · plate · slot") |
| `processed_by_staff_id` | `BIGINT` | — | FK → users; nullable (null for online pay) |
| `method` | `VARCHAR(255)` enum | — | `CASH`, `ONLINE`, `VNPAY` (nullable) |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=PENDING | `PENDING`, `PAID`, `VOIDED` |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Payment record creation |
| `paid_at` | `TIMESTAMP` | — | When payment settled (nullable) |
| `voided_at` | `TIMESTAMP` | — | When voided (nullable) |
| `void_reason` | `VARCHAR(255)` | — | Reason for void (nullable) |
| `gateway_ref` | `VARCHAR(255)` | — | VNPay txn ref (vnp_TxnRef), UNIQUE (nullable) |
| `gateway_txn_no` | `VARCHAR(255)` | — | VNPay's txn number, nullable |
| `gateway_response_code` | `VARCHAR(255)` | — | VNPay response code ("00" = success), nullable |

**Relationships:**
- 1:1 → ParkingSession (session_id, unique, optional)
- N:1 → User (processed_by_staff_id, optional)
- 1:N ← MonthlyPass (payment_id, optional)
- 1:N ← Reservation (deposit_payment_id, optional)

---

### ExceptionReport

**Table:** `exception_report`  
**Purpose:** Track parking violations (lost ticket, wrong plate, overtime, wrong zone)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `session_id` | `BIGINT` | — | FK → parking_session (nullable; lost ticket may have no findable session) |
| `reported_by` | `BIGINT` | NOT NULL, FK → users | Staff member who reported |
| `type` | `VARCHAR(255)` enum | NOT NULL | `LOST_TICKET`, `WRONG_PLATE`, `OVERTIME`, `WRONG_ZONE` |
| `description` | `TEXT` | NOT NULL | Detailed description |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=OPEN | `OPEN`, `RESOLVED` |
| `resolution_note` | `TEXT` | — | Resolution notes (nullable) |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Report timestamp |
| `resolved_at` | `TIMESTAMP` | — | Resolution timestamp (nullable) |

**Relationships:**
- N:1 → ParkingSession (session_id, optional)
- N:1 → User (reported_by)

---

### MonthlyPass

**Table:** `monthly_pass`  
**Purpose:** Unlimited parking passes for a calendar month

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `user_id` | `BIGINT` | NOT NULL, FK → users | Pass owner |
| `vehicle_type_id` | `BIGINT` | NOT NULL, FK → vehicle_type | Vehicle type the pass covers |
| `license_plate` | `VARCHAR(255)` | NOT NULL | License plate for enforcement |
| `payment_id` | `BIGINT` | — | FK → payment (nullable; links to payment record) |
| `valid_from` | `DATE` | NOT NULL | Start date (inclusive) |
| `valid_until` | `DATE` | NOT NULL | End date (inclusive) |
| `status` | `VARCHAR(255)` enum | NOT NULL, default=PENDING | `PENDING`, `ACTIVE`, `EXPIRED` |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Creation timestamp |

**Relationships:**
- N:1 → User (user_id)
- N:1 → VehicleType (vehicle_type_id)
- N:1 → Payment (payment_id, optional)

---

### Feedback

**Table:** `feedback`  
**Purpose:** Driver feedback (rating + comment) on parking experience

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `BIGINT` | PRIMARY KEY, auto-increment | — |
| `session_id` | `BIGINT` | NOT NULL, FK → parking_session, UNIQUE | One feedback per session |
| `user_id` | `BIGINT` | NOT NULL, FK → users | Feedback author |
| `rating` | `SMALLINT` | NOT NULL | Numeric rating (e.g., 1–5) |
| `comment` | `VARCHAR(500)` | — | Text feedback (nullable) |
| `created_at` | `TIMESTAMP` | NOT NULL, immutable | Feedback timestamp |

**Relationships:**
- 1:1 → ParkingSession (session_id, unique)
- N:1 → User (user_id)

---

## Enumerations

### Role

**Used by:** User.role

| Value | Meaning |
|-------|---------|
| `ADMIN` | Full system access, user management |
| `MANAGER` | Building/floor/slot CRUD, pricing, analytics, reports |
| `STAFF` | Check-in/check-out, exception handling, cash collection |
| `USER` | Driver: reserve, view, track sessions, pay |

---

### SlotStatus

**Used by:** ParkingSlot.status

| Value | Meaning |
|-------|---------|
| `AVAILABLE` | Open for occupancy |
| `OCCUPIED` | Car currently parked or awaiting payment at booth |
| `RESERVED` | Pre-booked by a user |
| `MAINTENANCE` | Out of service (cleaning, repairs) |
| `LOCKED` | Administratively disabled (e.g., dangerous/blocked) |

---

### SessionStatus

**Used by:** ParkingSession.status

| Value | Meaning |
|-------|---------|
| `ACTIVE` | Driver still in building |
| `AWAITING_PAYMENT` | Driver has checked out; payment not yet settled; slot remains OCCUPIED until payment clears or void |
| `COMPLETED` | Session fully settled |

---

### PaymentStatus

**Used by:** Payment.status

| Value | Meaning |
|-------|---------|
| `PENDING` | Payment awaiting settlement |
| `PAID` | Payment successfully collected |
| `VOIDED` | Payment cancelled/refunded |

---

### PaymentMethod

**Used by:** Payment.method

| Value | Meaning |
|-------|---------|
| `CASH` | Collected by staff at the booth |
| `ONLINE` | Mock payment (test/demo) |
| `VNPAY` | VNPay gateway integration (production credit card / e-wallet) |

---

### ReservationType

**Used by:** Reservation.reservation_type

| Value | Meaning |
|-------|---------|
| `FREE` | AI assigns slot at check-in, 10% discount |
| `PAID` | Driver picks slot, pays 1hr deposit via VNPay |

---

### ReservationStatus

**Used by:** Reservation.status

| Value | Meaning |
|-------|---------|
| `PENDING` | Reservation waiting for occupancy or payment |
| `FULFILLED` | Driver has checked in to the reserved slot |
| `CANCELLED` | User cancelled the reservation |
| `EXPIRED` | Hold-until window passed without checkin/payment |

---

### ExceptionType

**Used by:** ExceptionReport.type

| Value | Meaning |
|-------|---------|
| `LOST_TICKET` | Driver lost their ticket (QR code) |
| `WRONG_PLATE` | Vehicle plate doesn't match session record |
| `OVERTIME` | Parked beyond daily cap or grace window |
| `WRONG_ZONE` | Vehicle parked on wrong floor/zone for its type |

---

### ExceptionStatus

**Used by:** ExceptionReport.status

| Value | Meaning |
|-------|---------|
| `OPEN` | Report filed; awaiting staff resolution |
| `RESOLVED` | Resolution notes added; case closed |

---

### PassStatus

**Used by:** MonthlyPass.status

| Value | Meaning |
|-------|---------|
| `PENDING` | Pass purchased but not yet activated |
| `ACTIVE` | Pass is valid; zeroes checkout charges for matching vehicle type |
| `EXPIRED` | Pass no longer valid; archival state |

---

## Flyway Migrations

Database schema is managed by Flyway. Listed below in order of application:

| Migration | Purpose |
|-----------|---------|
| **V1__init_users.sql** | User and Role enum |
| **V2__parking_domain.sql** | ParkingBuilding, Floor, ParkingSlot, SlotStatus enum |
| **V3__vehicle_type_pricing.sql** | VehicleType, PricingPolicy |
| **V4__parking_session.sql** | ParkingSession, SessionStatus enum |
| **V5__floor_vehicle_type_allocation.sql** | Add vehicle_type_id FK to Floor for zone segmentation |
| **V6__pricing_peak_multiplier.sql** | Add peak_multiplier to PricingPolicy |
| **V7__payment.sql** | Payment, PaymentStatus enum, PaymentMethod enum |
| **V8__reservation.sql** | Reservation, ReservationStatus enum |
| **V9__exception_report.sql** | ExceptionReport, ExceptionType enum, ExceptionStatus enum |
| **V10__session_user.sql** | Migrate user association logic |
| **V11__payment_void.sql** | Add voided_at, void_reason to Payment |
| **V12__session_ticket_code.sql** | Add ticket_code (UUID) to ParkingSession |
| **V13__payment_audit.sql** | Add processed_by_staff_id FK to Payment |
| **V14__pricing_policy_active.sql** | Add is_active flag to PricingPolicy (soft-disable) |
| **V15__monthly_pass.sql** | MonthlyPass, PassStatus enum |
| **V16__payment_vnpay.sql** | Add gateway_ref, gateway_txn_no, gateway_response_code to Payment |
| **V17__feedback.sql** | Feedback with rating + comment |
| **V18__password_reset_token.sql** | PasswordResetToken for password reset flow |
| **V19__pass_pricing.sql** | Add monthly_pass_price to PricingPolicy; add payment_id FK to MonthlyPass |
| **V20__allocation_score.sql** | Add allocation_score (JSONB) to ParkingSession |
| **V21__reservation_allocation_score.sql** | Add allocation_score (JSONB) to Reservation |
| **V22__reservation_tiers.sql** | Add reservation_type, reserved_start, building_id, deposit_amount, deposit_payment_id to Reservation; add from_reservation, deposit_credit to ParkingSession |
| **V23__payment_description.sql** | Add description column to Payment for sessionless payment identification |

---

## Key Relationships Summary

### Hierarchy Tree

```
ParkingBuilding (1)
  └─ Floor (N)
      └─ ParkingSlot (N)
          ├─ ParkingSession (1..N)
          │   ├─ Payment (1)
          │   ├─ ExceptionReport (0..N)
          │   └─ Feedback (1)
          └─ Reservation (0..N)

VehicleType (1)
  ├─ PricingPolicy (1:1, unique)
  ├─ Floor (0..N, optional)
  ├─ ParkingSession (N)
  ├─ Reservation (N)
  └─ MonthlyPass (N)

User (1)
  ├─ PasswordResetToken (0..N)
  ├─ ParkingSession (0..N)
  ├─ Reservation (N)
  ├─ ExceptionReport (N, as reporter)
  ├─ Payment (0..N, as staff processor)
  ├─ MonthlyPass (N)
  └─ Feedback (N)
```

### Cardinality Summary

| Relationship | Cardinality | Notes |
|--------------|-------------|-------|
| User ↔ PasswordResetToken | 1:N | One user, many reset tokens (for audit) |
| ParkingBuilding ↔ Floor | 1:N | One building, many floors |
| Floor ↔ ParkingSlot | 1:N | One floor, many slots |
| VehicleType ↔ PricingPolicy | 1:1 unique | One active policy per vehicle type |
| VehicleType ↔ Floor | N:1 optional | Floor may specialize for a vehicle type |
| VehicleType ↔ ParkingSession | N:1 | Session requires vehicle type for tariff |
| ParkingSlot ↔ ParkingSession | 1:N | Slot has many sessions over time |
| User ↔ ParkingSession | N:1 optional | Session may have no user (staff walk-in) |
| ParkingSession ↔ Payment | 1:1 optional | Session may have one payment (nullable for unpaid) |
| ParkingSession ↔ Feedback | 1:1 | One feedback per session |
| User ↔ ExceptionReport | N:1 | Reporter is a User |
| ParkingSession ↔ ExceptionReport | N:1 optional | Report may lack session (lost ticket) |
| User ↔ Reservation | N:1 | Reservation owner is a User |
| User ↔ MonthlyPass | N:1 | Pass owner is a User |
| Payment ↔ MonthlyPass | N:1 optional | Pass may link to payment |

