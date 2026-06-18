# AI Slot Allocation (Key Feature)

The priority feature for grading. Instead of staff hand-picking a slot, the system
scores every available slot and auto-assigns the best one. Directly answers the
research questions (RQ2–RQ4).

## Scoring model (`SlotAllocationService`)

Each available slot gets a weighted score; the highest wins.

```
score = vehicleTypeMatch(40) + loadBalance(30) + distanceToEntry(20) + peakHour(10)
```

| Criterion | Weight | Logic |
|---|---|---|
| Vehicle type match | 40 | Floor reserved for this type → full 40; mixed floor → 20 (neutral); wrong type → 0 |
| Load balance | 30 | `availableRatio * 30` — favors emptier floors, spreads load |
| Distance to entry | 20 | `20 / floor.level` — lower floors score higher (closer to entry) |
| Peak hour | 10 | During peak only: `availableRatio * 10` — extra push toward emptier floors |

Greedy max — one pass over available slots, picks the single best. No global
optimization across multiple incoming vehicles (not needed at demo scale).

## Where it runs

- **Check-in** (`/api/staff/sessions/check-in`) — staff omit `slotId` → auto-allocate.
- **Reservation** (`/api/driver/reservations`) — driver pre-book picks + holds the best slot.

Both call `allocate(buildingId, vehicleTypeId)`. Concurrency: the allocate-then-flip
window is guarded by a re-check + retry-once, not a row lock — upgrade to
`SELECT ... FOR UPDATE` or `@Version` only if real contention shows up.

## Analytics

`GET /api/manager/buildings/{id}/analytics/allocation` returns fill-rate per floor —
the evidence base for the research questions. `parking_session`'s indexed
`check_in_at` / `status` keep time-to-park and session-duration metrics queryable.

## Research link

- **RQ1** — floor-by-vehicle-type segmentation feeds the vehicleTypeMatch term; its
  weight (40) makes type-correct floors dominate the choice.
- **RQ2** — auto allocation vs free choice: compare time-to-park and session metrics
  against the manual-pick baseline captured in `parking_session`.
- **RQ3** — which criteria matter most: the four weights are the tunable knobs to
  test; raise/zero each and re-measure utilization.
- **RQ4** — peak-hour utilization: the peak-hour term redistributes load toward
  emptier floors exactly when the building is busiest.

## Why weighted scoring (not ML)

Transparent, tunable, explainable to instructors. Each weight maps to one research
question, so the algorithm itself is the experiment. A black-box model would answer
none of RQ3 — you couldn't say which criterion drove a decision.
