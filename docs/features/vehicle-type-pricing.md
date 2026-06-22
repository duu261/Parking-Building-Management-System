# Vehicle Types & Pricing

Each vehicle type (Car, Motorbike, Bicycle) has exactly one pricing policy. The
policy controls hourly rate, grace period, daily cap, peak-hour surcharge, monthly
pass pricing, and soft-disable.

## Model

| Entity | Field | Type | Notes |
|--------|-------|------|-------|
| VehicleType | `name` | VARCHAR (unique) | e.g. Car, Motorbike, Bicycle |
| VehicleType | `description` | VARCHAR | Human-readable label |
| PricingPolicy | `ratePerHour` | NUMERIC | Base hourly rate (VND) |
| PricingPolicy | `dailyCap` | NUMERIC? | Max charge per 24h (optional) |
| PricingPolicy | `graceMinutes` | INT | Free exit window (default 0) |
| PricingPolicy | `peakMultiplier` | NUMERIC | Surcharge factor during 7–9 AM, 5–7 PM (default 1.0) |
| PricingPolicy | `monthlyPassPrice` | NUMERIC? | Price for a monthly pass (optional) |
| PricingPolicy | `isActive` | BOOLEAN | Soft-disable: false hides from new check-ins |

One-to-one: each vehicle type has exactly one pricing policy (unique FK, cascade delete).

## Peak-Hour Pricing

When `peakMultiplier > 1.0`, check-ins during peak hours (7–9 AM, 5–7 PM) are
charged at `ratePerHour × peakMultiplier`. The same peak-hour window definition
is shared with the AI slot allocation `peakHour` scoring factor — one config
drives both surcharge and scoring.

## API (`/api/manager`, MANAGER role)

| Method | Path | Action |
|--------|------|--------|
| POST | `/vehicle-types` | Create type |
| GET | `/vehicle-types` | List (by name) |
| GET | `/vehicle-types/{id}` | Get one |
| PUT | `/vehicle-types/{id}` | Update |
| DELETE | `/vehicle-types/{id}` | Delete (cascades policy) |
| PUT | `/vehicle-types/{id}/pricing` | Upsert the policy |
| GET | `/vehicle-types/{id}/pricing` | Get the policy |
| DELETE | `/vehicle-types/{id}/pricing` | Remove the policy |
| GET | `/pricing` | List all policies |

`PUT .../pricing` is an upsert — creates the policy if absent, replaces it otherwise.
Duplicate type names (case-insensitive) → 409. Missing type/policy → 404.

## Research Link

Floor/zone segmentation by vehicle type (RQ1) relies on the vehicle type model:
floors are optionally assigned a vehicle type, and the AI allocator's
`vehicleTypeMatch` criterion (40 pts) scores slots on type-matched floors higher.
