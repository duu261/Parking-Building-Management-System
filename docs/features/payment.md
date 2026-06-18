# Payment & Peak-Hour Pricing

## What it does
- Every check-out creates a Payment record for the computed charge.
- Charged exits start PENDING; free exits (within the grace window) are auto-PAID.
- Staff settle a payment by method (CASH or mock ONLINE); double-settle is rejected.
- Managers read revenue (sum of PAID + count) for any time window.
- Pricing supports a peak-hour multiplier: a vehicle type's rate is surcharged
  when check-in falls in peak hours (7-9 AM, 5-7 PM), sharing one peak-hour
  definition with slot allocation.

## API
- `POST /api/staff/payments/{id}/settle` — body `{ "method": "CASH" | "ONLINE" }`
- `GET  /api/staff/payments/pending`
- `GET  /api/staff/payments/{id}`
- `GET  /api/manager/payments/revenue?from=<ISO>&to=<ISO>`
- Pricing upsert now carries `peakMultiplier` (>= 1.0).

## Pricing math
`charge = ceil((minutes - grace) / 60) * ratePerHour`, capped at
`dailyCap * startedDays`, then multiplied by the peak factor when applicable.

## Research link (RQ4)
The peak multiplier is dynamic, demand-based pricing: raising the price during
peak hours is a yield-management lever for peak-hour utilization.
