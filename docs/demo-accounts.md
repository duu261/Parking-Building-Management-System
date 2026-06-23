# Demo Accounts

Dev-profile seed data (`@Profile("dev")`, runs once on empty database).

## System Accounts

| Role | Email | Password | What to show |
|------|-------|----------|--------------|
| Admin | `admin@parkmaster.dev` | `password123` | User management, role assignment |
| Manager | `manager@parkmaster.dev` | `password123` | Building/floor/slot CRUD, pricing, analytics, passes, revenue |
| Staff | `staff@parkmaster.dev` | `password123` | Check-in/out, payment settlement, exception reports |
| Driver | `driver@parkmaster.dev` | `password123` | Reservation, session history, feedback, monthly pass purchase |

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

## Seeded Data Overview

| Data | Count | Notes |
|------|-------|-------|
| Historical sessions | ~180-450 | Spread across 30 days, all drivers, with PAID payments |
| Active sessions | 5 | 2 main driver (45min Car + 3h EV billable demo) + 3 extras |
| Reservations | 5 | Driver: PENDING. Extras: FULFILLED, CANCELLED, EXPIRED, PENDING |
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

All 5 active sessions have `allocationScore` JSON with AI scoring breakdown (`vehicleTypeMatch`, `loadBalance`, `distanceToEntry`, `peakHour`). Driver's 3h EV session is the best for demonstrating checkout → payment flow (≈45k VND charge, past grace period).
