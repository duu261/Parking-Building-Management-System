# Monthly Pass (Free Parking for Regular Commuters)

## What it does
- A manager issues a monthly pass to a driver for one vehicle type and plate,
  valid over a date range (e.g. the calendar month).
- While the pass is active, that vehicle parks for free: check-out computes a
  zero charge instead of the per-hour rate.
- A manager can list, inspect, and revoke passes. Revoking flips status to
  EXPIRED so the next check-out bills normally again.
- Backend only for now: drivers do not self-purchase (no payment flow yet).

## Flow
1. **Issue** (manager) - validates the date range, resolves the driver and
   vehicle type, rejects a pass that overlaps an existing ACTIVE pass for the
   same plate+type, then saves it ACTIVE.
2. **Check-out** (staff, any vehicle) - the session service asks
   `hasActivePass(plate, vehicleTypeId, today)`. If true, charge is 0 and the
   existing free-exit path runs: session COMPLETED, slot released to AVAILABLE.
   If false, normal per-hour billing (grace, daily cap, peak multiplier).
3. **Revoke** (manager) - ACTIVE -> EXPIRED; future check-outs bill again.

## API
- `POST   /api/manager/passes` - body `{ userId, vehicleTypeId, licensePlate, validFrom, validUntil }`, returns `201` + `PassResponse`
- `GET    /api/manager/passes` - all passes, newest first
- `GET    /api/manager/passes/{id}`
- `DELETE /api/manager/passes/{id}` - revoke (sets EXPIRED)

`PassResponse`: `{ id, userId, userFullName, vehicleTypeId, vehicleTypeName, licensePlate, validFrom, validUntil, status, createdAt }`. MANAGER (or ADMIN) role required.

## Validity & timezone
The active-pass check pushes the date-range filter into the DB query
(`validFrom <= today AND validUntil >= today`, indexed on plate+type+status).
"Today" is `LocalDate.now(Asia/Ho_Chi_Minh)` - the app calendar day - so a pass
does not expire a few hours early on UTC midnight.

## Duplicate-overlap guard
Issuing rejects a new pass whose range overlaps an existing ACTIVE pass for the
same plate+type, preventing two overlapping free windows on one vehicle.

## Deliberate scope cut
No driver self-service purchase and no payment for the pass itself - issuance is
a manager action only. The extensibility point is clear: a driver endpoint plus
a Payment on the pass would layer on top of the same entity and active-pass
check without touching the check-out logic.
