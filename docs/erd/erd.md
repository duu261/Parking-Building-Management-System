# ParkMaster ERD and Current Database Schema

This document is generated from the backend Flyway migrations `V1__init_users.sql` through `V23__payment_description.sql`, with JPA entities used as a cross-check for relationships and enum values.

## Mermaid ERD

```mermaid
erDiagram
    USERS {
        BIGSERIAL id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR full_name
        VARCHAR role
        BOOLEAN active
        TIMESTAMPTZ created_at
    }

    PARKING_BUILDING {
        BIGSERIAL id PK
        VARCHAR name
        VARCHAR address
        TIMESTAMPTZ created_at
    }

    FLOOR {
        BIGSERIAL id PK
        BIGINT building_id FK
        BIGINT vehicle_type_id FK
        INT level
        VARCHAR name
        TIMESTAMPTZ created_at
    }

    PARKING_SLOT {
        BIGSERIAL id PK
        BIGINT floor_id FK
        VARCHAR code
        VARCHAR status
        TIMESTAMPTZ created_at
    }

    VEHICLE_TYPE {
        BIGSERIAL id PK
        VARCHAR name UK
        VARCHAR description
        TIMESTAMPTZ created_at
    }

    PRICING_POLICY {
        BIGSERIAL id PK
        BIGINT vehicle_type_id FK_UK
        NUMERIC rate_per_hour
        NUMERIC daily_cap
        INT grace_minutes
        NUMERIC peak_multiplier
        NUMERIC monthly_pass_price
        BOOLEAN is_active
        TIMESTAMPTZ created_at
    }

    PARKING_SESSION {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT slot_id FK
        BIGINT vehicle_type_id FK
        VARCHAR license_plate
        VARCHAR ticket_code UK
        TIMESTAMPTZ check_in_at
        TIMESTAMPTZ check_out_at
        NUMERIC amount_charged
        VARCHAR status
        BOOLEAN auto_allocated
        JSONB allocation_score
        NUMERIC deposit_credit
        BOOLEAN from_reservation
        TIMESTAMPTZ created_at
    }

    PAYMENT {
        BIGSERIAL id PK
        BIGINT session_id FK_UK
        BIGINT processed_by_staff_id FK
        NUMERIC amount
        NUMERIC penalty_amount
        VARCHAR method
        VARCHAR status
        VARCHAR description
        VARCHAR gateway_ref UK
        VARCHAR gateway_txn_no
        VARCHAR gateway_response_code
        TIMESTAMPTZ created_at
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ voided_at
        VARCHAR void_reason
    }

    RESERVATION {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT slot_id FK
        BIGINT vehicle_type_id FK
        BIGINT building_id FK
        BIGINT deposit_payment_id FK
        VARCHAR license_plate
        TIMESTAMPTZ hold_until
        TIMESTAMPTZ reserved_start
        VARCHAR reservation_type
        NUMERIC deposit_amount
        JSONB allocation_score
        TIMESTAMPTZ created_at
        VARCHAR status
    }

    EXCEPTION_REPORT {
        BIGSERIAL id PK
        BIGINT session_id FK
        BIGINT reported_by FK
        VARCHAR type
        TEXT description
        VARCHAR status
        TEXT resolution_note
        TIMESTAMPTZ created_at
        TIMESTAMPTZ resolved_at
    }

    MONTHLY_PASS {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT vehicle_type_id FK
        BIGINT payment_id FK
        VARCHAR license_plate
        DATE valid_from
        DATE valid_until
        VARCHAR status
        TIMESTAMPTZ created_at
    }

    FEEDBACK {
        BIGSERIAL id PK
        BIGINT session_id FK_UK
        BIGINT user_id FK
        SMALLINT rating
        VARCHAR comment
        TIMESTAMPTZ created_at
    }

    PASSWORD_RESET_TOKEN {
        BIGSERIAL id PK
        BIGINT user_id FK
        VARCHAR token UK
        TIMESTAMPTZ expires_at
        BOOLEAN used
        TIMESTAMPTZ created_at
    }

    PARKING_BUILDING ||--o{ FLOOR : contains
    VEHICLE_TYPE ||--o{ FLOOR : assigned_to
    FLOOR ||--o{ PARKING_SLOT : contains
    VEHICLE_TYPE ||--|| PRICING_POLICY : priced_by

    USERS ||--o{ PARKING_SESSION : owns
    PARKING_SLOT ||--o{ PARKING_SESSION : used_by
    VEHICLE_TYPE ||--o{ PARKING_SESSION : classifies
    PARKING_SESSION ||--o| PAYMENT : charged_by

    USERS ||--o{ PAYMENT : processes
    USERS ||--o{ RESERVATION : creates
    PARKING_SLOT ||--o{ RESERVATION : reserved_slot
    VEHICLE_TYPE ||--o{ RESERVATION : requested_type
    PARKING_BUILDING ||--o{ RESERVATION : requested_building
    PAYMENT ||--o{ RESERVATION : deposit_for

    PARKING_SESSION ||--o{ EXCEPTION_REPORT : has
    USERS ||--o{ EXCEPTION_REPORT : reports
    USERS ||--o{ MONTHLY_PASS : owns
    VEHICLE_TYPE ||--o{ MONTHLY_PASS : applies_to
    PAYMENT ||--o{ MONTHLY_PASS : pays_for
    PARKING_SESSION ||--o| FEEDBACK : receives
    USERS ||--o{ FEEDBACK : writes
    USERS ||--o{ PASSWORD_RESET_TOKEN : has
```

## Relationship Summary

| Parent table | Child table | FK column | Cardinality | Notes |
| --- | --- | --- | --- | --- |
| `parking_building` | `floor` | `floor.building_id` | 1 to many | Cascade delete from building to floors. |
| `vehicle_type` | `floor` | `floor.vehicle_type_id` | 1 to many, optional | Floor can be dedicated to a vehicle type. |
| `floor` | `parking_slot` | `parking_slot.floor_id` | 1 to many | Cascade delete from floor to slots. |
| `vehicle_type` | `pricing_policy` | `pricing_policy.vehicle_type_id` | 1 to 1 | Unique FK, cascade delete from vehicle type. |
| `users` | `parking_session` | `parking_session.user_id` | 1 to many, optional | Nullable for staff walk-in sessions. |
| `parking_slot` | `parking_session` | `parking_session.slot_id` | 1 to many | Each session uses one slot. |
| `vehicle_type` | `parking_session` | `parking_session.vehicle_type_id` | 1 to many | Session vehicle classification. |
| `parking_session` | `payment` | `payment.session_id` | 1 to 0..1 | Nullable because monthly pass payments have no session. Unique when present. |
| `users` | `payment` | `payment.processed_by_staff_id` | 1 to many, optional | Staff member who processed cash/void. |
| `users` | `reservation` | `reservation.user_id` | 1 to many | Driver reservations. |
| `parking_slot` | `reservation` | `reservation.slot_id` | 1 to many, optional | Nullable for free AI allocation reservations. |
| `vehicle_type` | `reservation` | `reservation.vehicle_type_id` | 1 to many | Requested vehicle type. |
| `parking_building` | `reservation` | `reservation.building_id` | 1 to many, optional | Used for free reservations before a slot is selected. |
| `payment` | `reservation` | `reservation.deposit_payment_id` | 1 to many, optional | Deposit/payment for paid reservations. |
| `parking_session` | `exception_report` | `exception_report.session_id` | 1 to many, optional | Report can exist without session link. |
| `users` | `exception_report` | `exception_report.reported_by` | 1 to many | Staff/user who created the report. |
| `users` | `monthly_pass` | `monthly_pass.user_id` | 1 to many | Driver pass ownership. |
| `vehicle_type` | `monthly_pass` | `monthly_pass.vehicle_type_id` | 1 to many | Pass applies to one vehicle type. |
| `payment` | `monthly_pass` | `monthly_pass.payment_id` | 1 to many, optional | Payment for monthly pass. |
| `parking_session` | `feedback` | `feedback.session_id` | 1 to 0..1 | One feedback per session. |
| `users` | `feedback` | `feedback.user_id` | 1 to many | Driver/user feedback author. |
| `users` | `password_reset_token` | `password_reset_token.user_id` | 1 to many | Password reset tokens. |

## Enum Values

| Column group | Values |
| --- | --- |
| User role | `ADMIN`, `MANAGER`, `STAFF`, `USER` |
| Slot status | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `LOCKED` |
| Session status | `ACTIVE`, `AWAITING_PAYMENT`, `COMPLETED` |
| Payment method | `CASH`, `ONLINE`, `VNPAY` |
| Payment status | `PENDING`, `PAID`, `VOIDED` |
| Reservation type | `FREE`, `PAID` |
| Reservation status | `PENDING`, `FULFILLED`, `CANCELLED`, `EXPIRED` |
| Exception type | `LOST_TICKET`, `WRONG_PLATE`, `OVERTIME`, `WRONG_ZONE` |
| Exception status | `OPEN`, `RESOLVED` |
| Monthly pass status | `PENDING`, `ACTIVE`, `EXPIRED` |

## Important Constraints and Indexes

| Table | Constraint or index | Purpose |
| --- | --- | --- |
| `users` | `email` unique, `idx_users_email` | Login lookup. |
| `floor` | `UNIQUE (building_id, level)`, `idx_floor_building` | Prevent duplicate floor levels per building. |
| `parking_slot` | `UNIQUE (floor_id, code)`, `idx_slot_floor`, `idx_slot_status` | Slot lookup and status filtering. |
| `pricing_policy` | `vehicle_type_id` unique | One active pricing row per vehicle type, with soft-disable via `is_active`. |
| `parking_session` | `ticket_code` unique, indexes on `slot_id`, `status`, `check_in_at`, `user_id` | QR ticket lookup, active sessions, reports. |
| `payment` | `session_id` unique nullable, `gateway_ref` unique, indexes on `status`, `paid_at`, `processed_by_staff_id` | Session settlement, VNPay reference, revenue/staff reports. |
| `reservation` | indexes on `(status, hold_until)`, `user_id`, `(reservation_type, status, reserved_start)` | Expiry sweep and driver reservation listing. |
| `exception_report` | `idx_exception_report_status (status, created_at)` | Open exception queue. |
| `monthly_pass` | `idx_monthly_pass_lookup (license_plate, vehicle_type_id, status)` | Checkout pass lookup. |
| `feedback` | `session_id` unique, rating check 1-5 | One feedback per session. |
| `password_reset_token` | `token` unique | Password reset verification. |

## Files

- `schema-current.sql`: normalized current SQL schema after all migrations.
- `README.md`: ERD, relationships, enum values, and reporting notes.
