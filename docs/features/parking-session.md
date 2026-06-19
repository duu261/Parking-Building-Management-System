# Parking Session (Check-in / Check-out)

The core operational flow: staff park a vehicle into a chosen slot, then close the
session on exit and collect the computed charge. Slot allocation is manual here;
AI auto-allocation is a separate feature on top of this.

## Model

| Entity | Fields | Notes |
|---|---|---|
| `ParkingSession` | `slot`, `vehicleType`, `licensePlate`, `checkInAt`, `checkOutAt?`, `amountCharged?`, `status` | doubles as the ticket for now |

`status`: `ACTIVE` → `AWAITING_PAYMENT` → `COMPLETED`. Session moves to `AWAITING_PAYMENT` at check-out while charge is settled; slot stays `OCCUPIED` during this phase. Session completes after payment is settled.

## Flow

1. **Check-in** — slot must be `AVAILABLE`; session created, slot → `OCCUPIED`.
2. **Check-out** — charge computed from the vehicle type's `PricingPolicy`, session → `AWAITING_PAYMENT`, slot stays `OCCUPIED`.
3. **Payment settled** — slot → `AVAILABLE`, session → `COMPLETED`.

Conflicts: non-available slot → 409; closing a closed session → 409; no pricing
policy for the type at checkout → 409.

## Charge math (`ChargeCalculator`)

Pure, isolated, unit-tested separately from persistence.

```
billable = totalMinutes - graceMinutes
charge   = ceil(billable / 60) * ratePerHour        (0 if within grace)
cap      = ceil(totalMinutes / 1440) * dailyCap      (per started day, if set)
final    = min(charge, cap)
```

Billed per *started* hour; cap scales per *started* day.

## API (`/api/staff/sessions`, STAFF role)

| Method | Path | Action |
|---|---|---|
| POST | `/check-in` | `{slotId, vehicleTypeId, licensePlate}` → session |
| POST | `/{id}/check-out` | close + charge |
| GET | `/active` | active sessions (by check-in time) |
| GET | `/{id}` | one session |

## Research link

- **RQ2** — `checkInAt`/`checkOutAt` give the time-to-park and session-duration
  baseline that AI allocation will be measured against.
- **RQ4** — indexed `status` + `check_in_at` keep fill-rate / peak-hour metrics queryable.

## Schema — `V4__parking_session.sql`

`parking_session` with FKs to `parking_slot` and `vehicle_type`; indexes on
`slot_id`, `status`, `check_in_at`. Money as `NUMERIC(10,2)`.
