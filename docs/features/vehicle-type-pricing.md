# Vehicle Types & Pricing

Manager-owned reference data: the catalog of vehicle classes the building accepts,
and the tariff charged per class. Feeds slot segmentation (RQ1) and session billing.

## Model

| Entity | Fields | Notes |
|---|---|---|
| `VehicleType` | `name` (unique), `description` | e.g. Car, Motorbike, Truck |
| `PricingPolicy` | `ratePerHour`, `dailyCap?`, `graceMinutes` | one policy per vehicle type (unique FK) |

`dailyCap` null = uncapped. `graceMinutes` = free minutes before billing starts.
Charge math lives with `ParkingSession` (built later); this domain only stores the tariff.

## API (`/api/manager`, MANAGER role)

| Method | Path | Action |
|---|---|---|
| POST | `/vehicle-types` | create type |
| GET | `/vehicle-types` | list (by name) |
| GET | `/vehicle-types/{id}` | get one |
| PUT | `/vehicle-types/{id}` | update |
| DELETE | `/vehicle-types/{id}` | delete (cascades policy) |
| PUT | `/vehicle-types/{id}/pricing` | upsert the policy |
| GET | `/vehicle-types/{id}/pricing` | get the policy |
| DELETE | `/vehicle-types/{id}/pricing` | remove the policy |
| GET | `/pricing` | list all policies |

`PUT .../pricing` is an upsert — creates the policy if absent, replaces it otherwise.
Duplicate type names (case-insensitive) → 409. Missing type/policy → 404.

## Research link

- **RQ1** — vehicle types are the segmentation key for floor/zone allocation; this
  catalog is what slots get matched against.
- Pricing differentiation per type lets reports compare revenue/utilization across
  classes once sessions exist.

## Schema — `V3__vehicle_type_pricing.sql`

`vehicle_type`, `pricing_policy` (FK `ON DELETE CASCADE`, unique on `vehicle_type_id`).
Money as `NUMERIC(10,2)`.
