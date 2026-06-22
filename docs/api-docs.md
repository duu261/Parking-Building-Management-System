# API Documentation — ParkMaster

Base URL: `/api` (proxied via Vite in dev, `VITE_API_URL` in prod)
Auth: Bearer JWT in `Authorization` header. Public endpoints need no token.
Errors: RFC 7807 problem details (`{ type, title, status, detail }`).

---

## Auth (`/api/auth`) — Public

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/auth/register` | `{ email, password, fullName }` | `{ token, id, email, fullName, role }` | Register new USER account |
| POST | `/auth/login` | `{ email, password }` | `{ token, id, email, fullName, role }` | Login, receive JWT |

---

## Public (`/api/public`) — No auth

| Method | Path | Params | Response | Description |
|---|---|---|---|---|
| GET | `/public/health` | — | `{ status, service, time }` | Health check |
| GET | `/public/buildings` | — | `[{ id, name, address }]` | List all buildings |
| GET | `/public/buildings/{id}/availability` | — | `{ buildingId, name, available }` | Available slot count |
| GET | `/public/pricing` | — | `[{ vehicleTypeId, vehicleTypeName, ratePerHour, dailyCap, graceMinutes, peakMultiplier }]` | All pricing policies |
| GET | `/public/buildings/{id}/allocation-preview` | `vehicleTypeId`, `limit` (default 6) | `[{ slotId, slotCode, floorId, floorName, level, vehicleTypeMatch, loadBalance, distanceToEntry, peakHour, total }]` | AI allocation score breakdown |
| POST | `/public/assistant/chat` | `{ message, history? }` | `{ reply, source }` | AI chat assistant (source: "ai" or "local") |

---

## Driver (`/api/driver`) — USER role

### Sessions

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/driver/sessions` | — | `[SessionResponse]` | List own sessions |
| GET | `/driver/sessions/{id}` | — | `SessionResponse` | Get session detail |
| GET | `/driver/sessions/{id}/ticket.png` | — | `image/png` (binary) | Ticket QR code image |

### Payments

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/driver/payments` | — | `[PaymentResponse]` | List own payments |
| POST | `/driver/payments/{id}/pay` | `{ method }` | `PaymentResponse` | Pay online (simulated) |

### Reservations

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/driver/reservations` | — | `[ReservationResponse]` | List own reservations |
| POST | `/driver/reservations` | `{ buildingId, vehicleTypeId, licensePlate }` | `ReservationResponse` | Reserve slot (AI picks) |
| POST | `/driver/reservations/{id}/cancel` | — | `204 No Content` | Cancel pending reservation |

### Passes

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/driver/passes` | — | `[PassResponse]` | Own passes |
| POST | `/driver/passes` | `{ vehicleTypeId, licensePlate, validFrom, validUntil }` | `PassResponse` | Register pass (creates PENDING payment) |
| GET | `/driver/passes/{id}/qr.png` | — | PNG | QR code image for pass |

### Feedback

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/driver/feedback` | `{ sessionId, rating, comment? }` | `FeedbackResponse` | Rate completed session (1–5 stars) |
| GET | `/driver/feedback` | — | `[FeedbackResponse]` | Own feedback history |

---

## Staff (`/api/staff`) — STAFF, MANAGER, ADMIN roles

### Lookups

| Method | Path | Response | Description |
|---|---|---|---|
| GET | `/staff/vehicle-types` | `[{ id, name, description }]` | Vehicle types for check-in form |
| GET | `/staff/buildings` | `[{ id, name, address }]` | Buildings for check-in form |
| GET | `/staff/buildings/{buildingId}/floors` | `[{ id, level, name, vehicleTypeId, vehicleTypeName }]` | Floors in building |
| GET | `/staff/floors/{floorId}/slots` | `[{ id, code, status }]` | Slots on floor |

### Sessions

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/staff/sessions/check-in` | `{ licensePlate, vehicleTypeId, buildingId?, slotId? }` | `SessionResponse` | Check in (auto if no slotId) |
| POST | `/staff/sessions/{id}/check-out` | — | `SessionResponse` | Check out, calculate charge |
| GET | `/staff/sessions/active` | — | `[SessionResponse]` | List active sessions |
| GET | `/staff/sessions/{id}` | — | `SessionResponse` | Get session by ID |
| GET | `/staff/sessions/by-ticket/{ticketCode}` | — | `SessionResponse` | Resolve ticket code to session |
| GET | `/staff/sessions/{id}/ticket.png` | — | `image/png` | Ticket QR code image |

### Payments

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/staff/payments/pending` | — | `[PaymentResponse]` | List pending payments |
| GET | `/staff/payments/{id}` | — | `PaymentResponse` | Get payment detail |
| POST | `/staff/payments/{id}/settle` | `{ method }` | `PaymentResponse` | Settle (CASH/CARD/ONLINE) |
| POST | `/staff/payments/{id}/void` | `{ reason }` | `PaymentResponse` | Void with reason |

### Exceptions

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/staff/exceptions` | `{ type, description, sessionId? }` | `ExceptionResponse` | Report exception |
| GET | `/staff/exceptions/open` | — | `[ExceptionResponse]` | List open exceptions |
| GET | `/staff/exceptions/{id}` | — | `ExceptionResponse` | Get exception detail |
| POST | `/staff/exceptions/{id}/resolve` | `{ resolutionNote }` | `ExceptionResponse` | Resolve exception |

---

## Manager (`/api/manager`) — MANAGER, ADMIN roles

### Buildings

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/manager/buildings` | — | `[BuildingResponse]` | List buildings |
| GET | `/manager/buildings/{id}` | — | `BuildingResponse` | Get building |
| POST | `/manager/buildings` | `{ name, address }` | `BuildingResponse` | Create building |
| PUT | `/manager/buildings/{id}` | `{ name, address }` | `BuildingResponse` | Update building |
| DELETE | `/manager/buildings/{id}` | — | `204` | Delete building |

### Floors

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/manager/buildings/{id}/floors` | — | `[FloorResponse]` | List floors |
| POST | `/manager/buildings/{id}/floors` | `{ level, name }` | `FloorResponse` | Create floor |
| PATCH | `/manager/floors/{id}/vehicle-type` | `{ vehicleTypeId }` | `FloorResponse` | Assign vehicle type |
| DELETE | `/manager/floors/{id}` | — | `204` | Delete floor |

### Slots

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/manager/floors/{id}/slots` | — | `[SlotResponse]` | List slots |
| POST | `/manager/floors/{id}/slots` | `{ code }` | `SlotResponse` | Create slot |
| PATCH | `/manager/slots/{id}/status` | `{ status }` | `SlotResponse` | Change slot status |
| DELETE | `/manager/slots/{id}` | — | `204` | Delete slot |

### Vehicle Types & Pricing

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/manager/vehicle-types` | — | `[VehicleTypeResponse]` | List types |
| GET | `/manager/vehicle-types/{id}` | — | `VehicleTypeResponse` | Get type |
| POST | `/manager/vehicle-types` | `{ name, description? }` | `VehicleTypeResponse` | Create type |
| PUT | `/manager/vehicle-types/{id}` | `{ name, description? }` | `VehicleTypeResponse` | Update type |
| DELETE | `/manager/vehicle-types/{id}` | — | `204` | Delete type |
| GET | `/manager/pricing` | — | `[PricingPolicyResponse]` | List all policies |
| GET | `/manager/vehicle-types/{id}/pricing` | — | `PricingPolicyResponse` | Get policy for type |
| PUT | `/manager/vehicle-types/{id}/pricing` | `{ ratePerHour, dailyCap?, graceMinutes }` | `PricingPolicyResponse` | Set/update policy |
| DELETE | `/manager/vehicle-types/{id}/pricing` | — | `204` | Delete policy |

### Revenue & Reports

| Method | Path | Params | Response | Description |
|---|---|---|---|---|
| GET | `/manager/payments/revenue` | `from`, `to` (ISO) | `RevenueResponse` | Total revenue in range |
| GET | `/manager/reports/revenue-daily` | `from`, `to` | `{ points: [{ date, amount }] }` | Daily revenue trend |
| GET | `/manager/reports/revenue-by-vehicle-type` | `from`, `to` | `{ points: [{ vehicleType, amount }] }` | Revenue by type |
| GET | `/manager/reports/check-ins-by-hour` | `from`, `to` | `{ points: [{ hour, count }] }` | Check-ins by hour |
| GET | `/manager/reports/duration-by-vehicle-type` | `from`, `to` | `{ points: [{ vehicleType, avgMinutes }] }` | Avg duration by type |
| GET | `/manager/reports/allocation-comparison` | `from`, `to` | `{ points: [{ method, count, avgDuration }] }` | Auto vs manual stats |

### Analytics

| Method | Path | Response | Description |
|---|---|---|---|
| GET | `/manager/buildings/{id}/analytics/allocation` | `{ buildingId, floors: [{ floorId, level, name, vehicleTypeId, total, occupied, available, fillRate }] }` | Floor fill-rate analytics |

### Monthly Passes

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/manager/passes` | `{ userId, vehicleTypeId, licensePlate, validFrom, validUntil }` | `201` `PassResponse` | Issue a pass (free parking while active) |
| GET | `/manager/passes` | — | `[PassResponse]` | List passes, newest first |
| GET | `/manager/passes/{id}` | — | `PassResponse` | Get pass |
| DELETE | `/manager/passes/{id}` | — | `PassResponse` | Revoke pass (status -> EXPIRED) |

### Feedback

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/manager/feedback` | — | `[FeedbackResponse]` | All feedback (newest first) |

---

## Admin (`/api/admin`) — ADMIN role only

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| GET | `/admin/users` | — | `[{ id, email, fullName, role, active, createdAt }]` | List all users |
| POST | `/admin/users` | `{ email, password, fullName, role }` | `UserSummary` | Create user with role |
| PATCH | `/admin/users/{id}/role` | `{ role }` | `UserSummary` | Change role |
| PATCH | `/admin/users/{id}/active` | `{ active }` | `UserSummary` | Activate/deactivate |

---

## Response Shapes

### SessionResponse
```json
{
  "id": 1,
  "slotId": 42,
  "vehicleTypeId": 2,
  "licensePlate": "51A-12345",
  "ticketCode": "uuid-string",
  "checkInAt": "2026-06-19T10:00:00Z",
  "checkOutAt": null,
  "amountCharged": null,
  "status": "ACTIVE",
  "autoAllocated": true
}
```

### PaymentResponse
```json
{
  "id": 1,
  "sessionId": 1,
  "amount": 25000,
  "penaltyAmount": 0,
  "method": "CASH",
  "status": "SETTLED",
  "createdAt": "2026-06-19T12:00:00Z",
  "paidAt": "2026-06-19T12:05:00Z",
  "voidedAt": null,
  "voidReason": null,
  "processedByStaff": "Staff Name"
}
```

### ReservationResponse
```json
{
  "id": 1,
  "status": "PENDING",
  "licensePlate": "51A-12345",
  "vehicleTypeId": 2,
  "slotId": 42,
  "slotCode": "B2-07",
  "holdUntil": "2026-06-19T10:30:00Z",
  "createdAt": "2026-06-19T10:00:00Z"
}
```

### PassResponse
```json
{
  "id": 1,
  "userId": 5,
  "userFullName": "Jane Driver",
  "vehicleTypeId": 2,
  "vehicleTypeName": "Car",
  "licensePlate": "51A-12345",
  "validFrom": "2026-07-01",
  "validUntil": "2026-07-31",
  "status": "ACTIVE",
  "createdAt": "2026-06-19T10:00:00Z"
}
```

### ExceptionResponse
```json
{
  "id": 1,
  "type": "LOST_TICKET",
  "status": "OPEN",
  "description": "Driver lost parking ticket",
  "sessionId": 5,
  "reportedBy": "staff@example.com",
  "resolutionNote": null,
  "createdAt": "2026-06-19T10:00:00Z",
  "resolvedAt": null
}
```

### RevenueResponse
```json
{
  "from": "2026-06-01T00:00:00Z",
  "to": "2026-06-30T23:59:59Z",
  "totalPaid": 1250000,
  "count": 87
}
```

---

## Enum Values

| Enum | Values |
|---|---|
| Role | `ADMIN`, `MANAGER`, `STAFF`, `USER` |
| SlotStatus | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `LOCKED` |
| SessionStatus | `ACTIVE`, `AWAITING_PAYMENT`, `COMPLETED` |
| ReservationStatus | `PENDING`, `FULFILLED`, `CANCELLED`, `EXPIRED` |
| PaymentStatus | `PENDING`, `PAID`, `VOIDED` |
| PaymentMethod | `CASH`, `ONLINE`, `VNPAY` |
| ExceptionType | `LOST_TICKET`, `WRONG_PLATE`, `OVERTIME`, `WRONG_ZONE` |
| ExceptionStatus | `OPEN`, `RESOLVED` |
| PassStatus | `PENDING`, `ACTIVE`, `EXPIRED` |

---

## Error Format (RFC 7807)

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Building not found"
}
```

Common status codes: `201` Created, `204` No Content, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict.
