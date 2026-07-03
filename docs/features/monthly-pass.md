# Monthly Pass — Self-Service Purchase with VNPay

## What it does
- Drivers buy monthly passes themselves: pick vehicle type, enter plate,
  choose start date (end = +1 month), pay via VNPay online.
- Manager sets the monthly pass price per vehicle type on the Pricing page
  (new `monthlyPassPrice` column on `PricingPolicy`).
- A pass starts **PENDING** until payment settles, then auto-activates to
  **ACTIVE**. While active, check-out charge is zero for that plate+type.
- Manager can still issue passes directly (admin override). Manager can also
  list all passes and revoke active ones.

## Purchase flow
1. **Driver registers pass** (`POST /api/driver/passes`) — backend looks up
   the monthly pass price from `PricingPolicy`, creates a `Payment` (PENDING,
   method=ONLINE), links it to the pass. Pass saved as PENDING.
2. **Frontend auto-redirects** to VNPay gateway (`POST /api/driver/payments/{id}/vnpay`).
   If the driver abandons payment, a "Pay now" button appears on the PENDING
   pass card for retry.
3. **VNPay return** — `handleVnPayReturn()` verifies the signature, marks
   Payment as PAID, then calls `activateLinkedPass(payment)` which flips the
   pass from PENDING to ACTIVE.
4. **Check-out** — `hasActivePass(plate, vehicleTypeId, today)` returns true,
   charge is 0, session completes normally.

## Payment settlement paths
All three settlement methods activate a linked pass if one exists:
- `settle()` — staff settles cash payment at counter
- `payOwn()` — driver pays online from My Payments
- `handleVnPayReturn()` — VNPay callback after gateway redirect

## API

### Driver (self-service)
- `POST /api/driver/passes` — body `{ vehicleTypeId, licensePlate, validFrom, validUntil }`,
  returns `201` + `PassResponse` (includes `paymentId`, `price`)
- `GET  /api/driver/passes` — own passes
- `POST /api/driver/payments/{id}/vnpay` — start VNPay checkout, returns `{ url }`

### Manager (admin)
- `POST   /api/manager/passes` — issue directly (also creates payment)
- `GET    /api/manager/passes` — all passes, newest first
- `GET    /api/manager/passes/{id}`
- `DELETE /api/manager/passes/{id}` — revoke (ACTIVE -> EXPIRED)

### Public
- `GET /api/public/pricing` — includes `monthlyPassPrice` per vehicle type

## PassResponse
```json
{
  "id": 1,
  "userId": 5,
  "userFullName": "Driver D",
  "vehicleTypeId": 2,
  "vehicleTypeName": "Car",
  "licensePlate": "51A-12345",
  "validFrom": "2026-07-01",
  "validUntil": "2026-07-31",
  "status": "PENDING",
  "paymentId": 42,
  "price": 200000,
  "createdAt": "2026-06-21T10:00:00Z"
}
```

## Pass lifecycle
```
PENDING  ──(payment settles)──>  ACTIVE  ──(manager revoke / expiry)──>  EXPIRED
```

## Overlap guard
Issuing rejects a new pass whose date range overlaps an existing ACTIVE **or
PENDING** pass for the same plate+type. Prevents duplicate purchases.

## Implementation Files

| Layer | File | Purpose |
|-------|------|---------|
| Service | `pass/MonthlyPassService.java` | `register()`, `activateLinkedPass()`, `hasActivePass()`, `revoke()`, overlap guard |
| Controller | `pass/DriverPassController.java` | `POST/GET /api/driver/passes` |
| Controller | `pass/ManagerPassController.java` | `POST/GET/DELETE /api/manager/passes`, direct issue + revoke |
| Entity | `pass/MonthlyPass.java` | `PassStatus` (PENDING/ACTIVE/EXPIRED), FK to Payment |
| DTO | `pass/PassDtos.java` | `PassResponse` (includes paymentId, price) |
| Payment | `payment/PaymentService.java` | `settle()`, `payOwn()`, `handleVnPayReturn()` all call `activateLinkedPass()` |
| Frontend | `pages/system/MonthlyPassesPage.jsx` | Manager: list, activate, revoke, filter by status |
| Frontend | `pages/user/PassesPage.jsx` | Driver: register, pay, view own passes |
| Migration | `V19__monthly_pass_payment.sql` | Added `monthly_pass_price` to pricing, `payment_id` to pass |

## Slide Notes

- **One-liner**: "Drivers buy monthly passes via VNPay — auto-activates on payment, free exit while active."
- **Demo flow**: Driver registers pass → auto-redirect to VNPay → payment confirms → pass ACTIVE → next check-out charge = 0.


## Pricing configuration
Manager sets `monthlyPassPrice` alongside hourly rate on the Pricing page.
If not configured (null or zero), pass registration returns 400.

## Frontend changes
- **Manager Pricing page** — new "Monthly pass" field in the 5-column form
- **Manager Passes page** — PENDING filter tab, pass price shown on cards
- **Driver Passes page** — "Awaiting payment" section for PENDING passes,
  "Pay now" button, auto-redirect to VNPay after registration
- **Public Pricing page** — monthly pass price row in each vehicle type card

## Validity & timezone
Active-pass check uses `LocalDate.now(Asia/Ho_Chi_Minh)` so a pass does not
expire early on UTC midnight.

## Database migration (V19)
```sql
ALTER TABLE pricing_policy ADD COLUMN monthly_pass_price NUMERIC(10, 0);
ALTER TABLE monthly_pass ADD COLUMN payment_id BIGINT REFERENCES payment(id);
ALTER TABLE payment ALTER COLUMN session_id DROP NOT NULL;
```
