# Payment & Charge Settlement

Two-phase payment lifecycle: check-out creates a PENDING payment, then staff
settles it (CASH / ONLINE) or the driver pays via VNPay. Supports penalty
surcharges from exception reports and void/reversal workflows.

## What it does

- Every check-out creates a Payment record for the computed charge.
- Charged exits start PENDING; free exits (within the grace window) are auto-PAID.
- Staff settle a payment by method (CASH or ONLINE); double-settle is rejected.
- Drivers can pay online via VNPay — see [VNPay Online Payment](vnpay-payment.md).
- Monthly-pass holders exit free (charge = 0, auto-PAID).
- Managers read revenue (sum of PAID + count) for any time window.

## Payment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: check-out creates payment
    PENDING --> PAID: staff settles (CASH/ONLINE)
    PENDING --> PAID: driver pays via VNPay
    PENDING --> VOIDED: manager voids with reason
    PAID --> [*]
    VOIDED --> [*]
```

## Penalty & Exception Flow

When an exception report is filed (lost ticket, wrong plate, overtime, wrong zone),
the penalty amount is added to the payment:

- `payment.amount` = base parking charge + penalty
- `payment.penalty_amount` records the penalty component separately
- Staff who processed the payment is tracked via `processed_by_staff_id`

## Pricing Math

- **Base rate**: `rate_per_hour × hours` (rounded up per started hour)
- **Grace period**: first N minutes free (configurable per vehicle type)
- **Daily cap**: max charge per 24-hour stay (optional)
- **Peak-hour multiplier**: surcharge when check-in falls in peak hours
  (7–9 AM, 5–7 PM), shared definition with slot allocation

## Void Flow

- Manager can void a payment with a reason (e.g., system error, dispute).
- Voided payments record `voided_at` timestamp and `void_reason`.
- Session status is unaffected — the void is a financial correction only.

## API

| Endpoint | Role | Purpose |
|----------|------|---------|
| `POST /api/staff/payments/{id}/settle` | Staff | Settle with `{ method: "CASH" }` |
| `GET /api/staff/payments/pending` | Staff | List unsettled payments |
| `GET /api/staff/payments/{id}` | Staff | Payment detail |
| `GET /api/manager/payments/revenue?from=&to=` | Manager | Revenue report |

## VNPay Integration

Full sandbox integration with HMAC-SHA512 signing, IPN callback verification,
and gateway reference tracking. See [vnpay-payment.md](vnpay-payment.md) for
the sequence diagram and security details.

## Data Model

```
payment
├── id                    PK
├── session_id            FK → parking_session (UNIQUE, optional)
├── amount                NUMERIC (base + penalty)
├── penalty_amount        NUMERIC (0 if no exception)
├── processed_by_staff_id FK → users (nullable)
├── method                ENUM (CASH | ONLINE | VNPAY)
├── status                ENUM (PENDING | PAID | VOIDED)
├── gateway_ref           VARCHAR (VNPay txn ref, unique)
├── gateway_txn_no        VARCHAR (VNPay's own txn number)
├── gateway_response_code VARCHAR ("00" = success)
├── void_reason           VARCHAR
├── created_at / paid_at / voided_at   TIMESTAMPTZ
```

## Research Link (RQ4)

Peak-hour pricing shares the same time-window definition as the AI allocation
`peakHour` factor — a single config drives both surcharge and scoring, making
the system coherent when analyzing peak-hour utilization.
