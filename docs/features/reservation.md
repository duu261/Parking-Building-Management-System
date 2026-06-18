# Reservation (Pre-Book a Slot)

## What it does
- A driver pre-books a parking slot in a building for their vehicle type.
- The AI allocator picks the best available slot and holds it as RESERVED.
- The hold lasts 30 minutes; if the driver does not check in, it auto-releases.
- Staff convert a reservation into an active session at the gate (one check-in
  flow, given the reservation id).
- A driver can list and cancel their own reservations.

## Flow
1. **Reserve** (driver) - allocator scores available slots, best one flips
   AVAILABLE -> RESERVED, reservation saved PENDING with a 30-minute holdUntil.
2. **Check-in** (staff) - reservation consumed: PENDING -> FULFILLED, slot
   RESERVED -> OCCUPIED, an active session is created on that slot.
3. **Cancel** (driver) - PENDING -> CANCELLED, slot released to AVAILABLE.
4. **Expire** (system) - a minute-interval sweep finds PENDING holds past
   holdUntil, sets EXPIRED and releases the slot.

## API
- `POST /api/driver/reservations` - body `{ buildingId, vehicleTypeId, licensePlate }`
- `GET  /api/driver/reservations` - the caller's reservations
- `POST /api/driver/reservations/{id}/cancel`
- Staff check-in (`POST /api/staff/sessions/check-in`) now accepts an optional
  `reservationId` to consume a hold.

## Research link (RQ2)
Reservation drives slot selection through the same scoring allocator used at
check-in, so a pre-booked arrival skips the search-and-park step entirely - the
strongest form of "auto allocation reduces time-to-park".
