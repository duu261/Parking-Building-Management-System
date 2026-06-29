# Demo Accounts

Dev-profile seed data (`@Profile("dev")`, runs once on empty database).

## System Accounts

| Role | Email | Password | What to show |
|------|-------|----------|--------------|
| Admin | `admin@parkmaster.dev` | `password123` | User management, role assignment |
| Manager | `manager@parkmaster.dev` | `password123` | Building/floor/slot CRUD, pricing, analytics, passes, revenue |
| Staff | `staff@parkmaster.dev` | `password123` | Check-in/out, payment settlement, exception reports |
| Driver | `driver@parkmaster.dev` | `password123` | All demoable states — see below |

## Extra Drivers (for realistic data volume)

| Email | Password | Notes |
|-------|----------|-------|
| `minh.nguyen@gmail.com` | `password123` | Active session (Car) + expired pass |
| `lan.tran@gmail.com` | `password123` | Active session (Motorbike) + active pass (Car) |
| `nam.le@gmail.com` | `password123` | Active session (EV) + pending pass (Motorbike) |
| `anh.pham@gmail.com` | `password123` | History only |
| `mai.vo@gmail.com` | `password123` | History only |
| `bao.hoang@gmail.com` | `password123` | History only |
| `huong.dang@gmail.com` | `password123` | History only |

## Driver Account — All Demoable States

Login: `driver@parkmaster.dev` / `password123`

### Dashboard (`/app`)
| What | Plate | Shows |
|------|-------|-------|
| Walk-in active (45min Car, AI) | 51F-00777 | AI badge + score breakdown |
| Walk-in active (3h EV, billable, AI) | 30K-99999 | High charge, best for checkout demo |
| FREE reservation active (90min, AI) | 51A-888.88 | "10% off" badge + live cost |
| PAID reservation active (60min, AI) | 51A-777.77 | "5,000₫ deposit" badge + live cost |
| AWAITING_PAYMENT (checked out 5min ago, AI) | 51A-666.66 | "Pay now via VNPay" button |
| Manual active (30min Motorbike) | 59X-12345 | No AI badge, no score breakdown |
| Manual active (1h Car) | 51G-67890 | No AI badge, no score breakdown |

### Reservations (`/app/reservations`)
| What | Plate | Shows |
|------|-------|-------|
| PAID reservation (deposit paid, arrives in 1h) | 51A-999.99 | "Paid" badge, slot locked, QR |
| FREE reservation (arrives in 1.5h) | 51A-888.88 | "10% off" badge, AI at check-in |

### Sessions (`/app/sessions`)
| What | Plate | Shows |
|------|-------|-------|
| Completed FREE reservation session | 51A-555.55 | "10% off applied", charge 9,000₫ |
| Completed PAID reservation session | 51A-444.44 | "Deposit credited 5,000₫", charge 5,000₫ |
| All active + awaiting payment sessions above | — | — |
| ~30 days historical sessions | various | Revenue/duration data |

### Other
- Active monthly pass (Motorbike) — free checkout demo
- Feedback entries on completed sessions

## Seeded Data Overview

| Data | Count | Notes |
|------|-------|-------|
| Historical sessions | ~180-450 | Spread across 30 days, all drivers, with PAID payments |
| Active sessions | 9 | Driver: 6 active (4 AI + 2 manual) + 1 awaiting payment + 2 completed reservation. Extras: 3 |
| Reservations | 6 | Driver: PAID + FREE pending. Extras: FULFILLED, CANCELLED, EXPIRED, PENDING |
| Monthly passes | 5 | Driver: 2× ACTIVE (Motorbike + Car). Extras: EXPIRED, ACTIVE, PENDING |
| Exception reports | 6 | 3 OPEN + 3 RESOLVED (LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE) |
| Feedback entries | 12 | Ratings 2-5 stars |
| Voided payments | 4 | With void reasons |
| Payment methods | 3 | CASH, ONLINE, VNPAY |
| Slot statuses | 2 | 1× MAINTENANCE + 1× LOCKED (last available slots) |

## Parking Infrastructure

- **2 buildings**: Downtown Garage (12 Le Loi, D1) + Campus Parking (FPT University, Thu Duc)
- **6 floors**: Downtown L1 Car (A×12), L2 Motorbike (B×16), L3 EV (C×8), Roof mixed (R×10); Campus Ground Car (G×15), Basement Motorbike (D×25)
- **86 slots total**: 12+16+8+10 + 15+25 (codes: A-01, B-01, C-01, R-01, G-01, D-01)
- **3 vehicle types**: Car (10k/hr), Motorbike (5k/hr), EV (15k/hr)

## AI Allocation Demo

AI-allocated sessions have `allocationScore` JSON with scoring breakdown (`vehicleTypeMatch`, `loadBalance`, `distanceToEntry`, `peakHour`) and show the "AI assigned" badge + score card. Manual sessions (59X-12345, 51G-67890) have `autoAllocated=false` and no score — useful for contrast demo.

Driver's 3h EV session (30K-99999) is the best for checkout → payment demo (≈45k VND charge, past grace period).

The PAID reservation page shows the full AI recommendation card with score breakdown when selecting a slot.
