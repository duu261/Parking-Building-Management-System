# Entity-Relationship Diagram — ParkMaster

Database: PostgreSQL. Schema managed by Flyway migrations.

---

## ERD (text representation)

```
┌──────────────────┐       ┌──────────────────────┐
│     users         │       │   vehicle_type        │
├──────────────────┤       ├──────────────────────┤
│ id          PK   │       │ id             PK    │
│ email       UQ   │       │ name           UQ    │
│ password_hash    │       │ description          │
│ full_name        │       │ created_at           │
│ role        ENUM │       └──────────┬───────────┘
│ active      BOOL │                  │
│ created_at       │                  │ 1
└───────┬──────────┘                  │
        │                             │
        │ 1                           │
        │                  ┌──────────┴───────────┐
        │                  │   pricing_policy      │
        │                  ├──────────────────────┤
        │                  │ id             PK    │
        │                  │ vehicle_type_id FK UQ│──── 1:1
        │                  │ rate_per_hour  DEC   │
        │                  │ daily_cap      DEC?  │
        │                  │ grace_minutes  INT   │
        │                  │ peak_multiplier DEC  │
        │                  │ created_at           │
        │                  └──────────────────────┘
        │
        │              ┌──────────────────────┐
        │              │  parking_building     │
        │              ├──────────────────────┤
        │              │ id             PK    │
        │              │ name                 │
        │              │ address              │
        │              │ created_at           │
        │              └──────────┬───────────┘
        │                         │ 1
        │                         │
        │                         │ *
        │              ┌──────────┴───────────┐
        │              │      floor            │
        │              ├──────────────────────┤
        │              │ id             PK    │
        │              │ building_id    FK    │──── N:1 parking_building
        │              │ vehicle_type_id FK?  │──── N:1 vehicle_type (optional)
        │              │ level          INT   │
        │              │ name                 │
        │              │ created_at           │
        │              └──────────┬───────────┘
        │                         │ 1
        │                         │
        │                         │ *
        │              ┌──────────┴───────────┐
        │              │   parking_slot        │
        │              ├──────────────────────┤
        │              │ id             PK    │
        │              │ floor_id       FK    │──── N:1 floor
        │              │ code                 │
        │              │ status         ENUM  │
        │              │ created_at           │
        │              └──┬─────────┬─────────┘
        │                 │         │
        │                 │ 1       │ 1
        │                 │         │
        │    *            │ *       │ *
┌───────┴─────────────────┴──┐  ┌──┴──────────────────┐
│    parking_session          │  │    reservation       │
├────────────────────────────┤  ├─────────────────────┤
│ id                  PK     │  │ id             PK   │
│ user_id             FK?    │  │ user_id        FK   │──── N:1 users
│ slot_id             FK     │  │ slot_id        FK   │──── N:1 parking_slot
│ vehicle_type_id     FK     │  │ vehicle_type_id FK  │──── N:1 vehicle_type
│ license_plate              │  │ license_plate       │
│ ticket_code         UQ     │  │ hold_until     TS   │
│ check_in_at         TS     │  │ created_at          │
│ check_out_at        TS?    │  │ status         ENUM │
│ amount_charged      DEC?   │  └─────────────────────┘
│ status              ENUM   │
│ auto_allocated      BOOL   │     ReservationStatus:
│ created_at (implicit)      │     PENDING | FULFILLED
└──────────┬─────────────────┘     | CANCELLED | EXPIRED
           │
           │ 1
           │
           │            ┌──────────────────────┐
           │ 1          │  exception_report     │
    ┌──────┴──────┐     ├──────────────────────┤
    │   payment    │     │ id             PK    │
    ├─────────────┤     │ session_id     FK?   │──── N:1 parking_session
    │ id       PK │     │ reported_by    FK    │──── N:1 users
    │ session_id FK│UQ   │ type           ENUM  │
    │ amount   DEC│     │ description    TEXT  │
    │ method  ENUM│     │ status         ENUM  │
    │ status  ENUM│     │ resolution_note TEXT?│
    │ created_at  │     │ created_at           │
    │ paid_at  TS?│     │ resolved_at    TS?   │
    │ voided_at TS│?    └──────────────────────┘
    │ void_reason?│
    └─────────────┘      ExceptionType:
                         LOST_TICKET | WRONG_PLATE
    PaymentStatus:       | OVERTIME | WRONG_ZONE
    PENDING | SETTLED
    | VOIDED              ExceptionStatus:
                         OPEN | RESOLVED
    PaymentMethod:
    CASH | CARD | ONLINE

    SessionStatus:
    ACTIVE | COMPLETED

    SlotStatus:
    AVAILABLE | OCCUPIED | RESERVED
    | MAINTENANCE | LOCKED

    Role:
    ADMIN | MANAGER | STAFF | USER
```

---

## Entity Summary

| Entity | Table | PK | Key relationships |
|---|---|---|---|
| User | `users` | id | Has many: sessions, reservations, exception_reports |
| VehicleType | `vehicle_type` | id | Has one: pricing_policy. Referenced by: floor, session, reservation |
| PricingPolicy | `pricing_policy` | id | Belongs to: vehicle_type (1:1 unique FK) |
| ParkingBuilding | `parking_building` | id | Has many: floors |
| Floor | `floor` | id | Belongs to: building, vehicle_type (optional). Has many: slots |
| ParkingSlot | `parking_slot` | id | Belongs to: floor. Has many: sessions, reservations |
| ParkingSession | `parking_session` | id | Belongs to: user (optional), slot, vehicle_type. Has one: payment |
| Reservation | `reservation` | id | Belongs to: user, slot, vehicle_type |
| Payment | `payment` | id | Belongs to: session (1:1 unique FK) |
| ExceptionReport | `exception_report` | id | Belongs to: session (optional), reported_by (user) |
| MonthlyPass | `monthly_pass` | id | Belongs to: user, vehicle_type |

---

## Relationship Cardinalities

```
users           1 ──── * parking_session     (driver owns sessions)
users           1 ──── * reservation         (driver makes reservations)
users           1 ──── * exception_report    (staff reports exceptions)
parking_building 1 ──── * floor              (building has floors)
floor           1 ──── * parking_slot        (floor has slots)
parking_slot    1 ──── * parking_session     (slot hosts sessions over time)
parking_slot    1 ──── * reservation         (slot can be reserved)
vehicle_type    1 ──── 1 pricing_policy      (one price per type)
vehicle_type    1 ──── * floor               (floor assigned to type)
vehicle_type    1 ──── * parking_session     (session for vehicle type)
vehicle_type    1 ──── * reservation         (reservation for vehicle type)
parking_session 1 ──── 1 payment             (one payment per session)
parking_session 1 ──── * exception_report    (session may have exceptions)
users           1 ──── * monthly_pass         (driver holds passes)
vehicle_type    1 ──── * monthly_pass         (pass for vehicle type)
```

---

## Enums

| Enum | Values | Used in |
|---|---|---|
| Role | ADMIN, MANAGER, STAFF, USER | users.role |
| SlotStatus | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, LOCKED | parking_slot.status |
| SessionStatus | ACTIVE, COMPLETED | parking_session.status |
| ReservationStatus | PENDING, FULFILLED, CANCELLED, EXPIRED | reservation.status |
| PaymentStatus | PENDING, SETTLED, VOIDED | payment.status |
| PaymentMethod | CASH, CARD, ONLINE | payment.method |
| ExceptionType | LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE | exception_report.type |
| ExceptionStatus | OPEN, RESOLVED | exception_report.status |
| PassStatus | ACTIVE, EXPIRED | monthly_pass.status |
