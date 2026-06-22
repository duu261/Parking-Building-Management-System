# Demo Accounts

Dev-profile seed data (`@Profile("dev")`, runs once on empty database).

## System Accounts

| Role | Email | Password | What to show |
|------|-------|----------|--------------|
| Admin | `admin@parkmaster.vn` | `password123` | User management, role assignment |
| Manager | `manager@parkmaster.vn` | `password123` | Building/floor/slot CRUD, pricing, analytics, passes, revenue |
| Staff | `staff@parkmaster.vn` | `password123` | Check-in/out, payment settlement, exception reports |
| Driver | `driver@parkmaster.vn` | `password123` | Reservation, session history, feedback, monthly pass purchase |

## Extra Drivers (for realistic data volume)

| Email | Password | Notes |
|-------|----------|-------|
| `nguyen.an@example.com` | `password123` | Has active session + expired pass |
| `tran.binh@example.com` | `password123` | Has active session + active pass |
| `le.chi@example.com` | `password123` | Has active session + pending pass |
| `pham.dung@example.com` | `password123` | History only |
| `hoang.em@example.com` | `password123` | History only |
| `vo.phuc@example.com` | `password123` | History only |
| `do.giang@example.com` | `password123` | History only |

## Seeded Data Overview

| Data | Count | Notes |
|------|-------|-------|
| Historical sessions | ~240-480 | Spread across 60 days, all drivers |
| Active sessions | 4 | 1 main driver + 3 extras |
| Reservations | 5 | All statuses: PENDING, FULFILLED, CANCELLED, EXPIRED |
| Monthly passes | 4 | ACTIVE, EXPIRED, ACTIVE, PENDING |
| Exception reports | 6 | 3 OPEN + 3 RESOLVED, all 4 types |
| Feedback entries | 12 | Ratings 2-5 stars |
| Voided payments | 4 | With void reasons |
| Payment methods | 3 | CASH, ONLINE, VNPAY |

## Parking Infrastructure

- **1 building**: FPT Parking Tower (10 Nguyen Trai, HCM)
- **4 floors**: Motorbike (L1), Car (L2-L3), Bicycle (L4)
- **70 slots**: 30 motorbike + 25+25 car + 20 bicycle (codes: M-01, C-01, B-01)
- **3 vehicle types**: Motorbike (5k/hr), Car (15k/hr), Bicycle (2k/hr)
