# Test Plan — ParkMaster

---

## 1. Test Strategy

| Level | Approach | Tools |
|---|---|---|
| Unit tests | Service-layer logic, pure functions | JUnit 5 + Mockito |
| Manual testing | Full user flows per role in browser | Dev server + seed data |
| Smoke test | Deploy target boots and responds | Health endpoint check |

No integration tests (real DB) or E2E automation in scope — SWP391 capstone scale.

---

## 2. Existing Unit Tests (14 files)

| Test class | What it covers | Domain |
|---|---|---|
| `AuthServiceTest` | Register, login, duplicate email, wrong password | Auth |
| `AdminUserServiceTest` | Create user, change role, activate/deactivate | User mgmt |
| `ParkingServiceTest` | Building/floor/slot CRUD, validation, conflicts | Parking infra |
| `PricingServiceTest` | Vehicle type CRUD, pricing policy set/update/delete | Pricing |
| `ChargeCalculatorTest` | Hourly charge, grace period, daily cap, edge cases | Billing |
| `SlotAllocationServiceTest` | AI scoring: type match, load balance, distance, peak | AI allocation |
| `ParkingSessionServiceTest` | Check-in (auto + manual), check-out, session lookup | Sessions |
| `SessionTicketTest` | Ticket code generation, QR PNG output | Ticket |
| `ReservationServiceTest` | Reserve, cancel, hold expiry, slot status flip | Reservations |
| `PaymentServiceTest` | Settle, void, pending list, status transitions | Payments |
| `ExceptionReportServiceTest` | Create, resolve, open list filter | Exceptions |
| `ReportServiceTest` | Revenue daily, by type, check-ins by hour, duration | Reports |
| `PeakHoursTest` | Peak-hour detection logic | Common |
| `MonthlyPassServiceTest` | Issue, revoke, overlap guard, active-pass check | Monthly pass |

Run: `cd backend && mvnd test`

---

## 3. Manual Test Scenarios

Test against user flows (see [user-flows.md](user-flows.md)). Use dev seed data profile.

### 3.1 Guest

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| G-01 | Landing page loads | Open `/` | Hero, slot map, allocation showcase, roles section visible |
| G-02 | Public pricing visible | Scroll or check network | Pricing data loads without auth |
| G-03 | Navigation to login | Click "Sign in" | Redirected to `/login` |

### 3.2 Auth

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| A-01 | Register new account | `/signup` → fill form → submit | Account created, redirected to driver dashboard |
| A-02 | Register duplicate email | Same email twice | Error "Email already in use" |
| A-03 | Register weak password | < 8 chars | Validation error |
| A-04 | Login valid | `/login` → correct creds | JWT stored, redirect to role dashboard |
| A-05 | Login wrong password | Wrong password | Error "Invalid email or password" |
| A-06 | Login deactivated user | Admin deactivates, user tries login | Login rejected |
| A-07 | Logo navigation | Click ParkMaster logo while logged in | Goes to role-appropriate dashboard, not landing |

### 3.3 Driver

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| D-01 | View empty sessions | Login as driver, go to `/parking` | Empty state shown |
| D-02 | Reserve slot | `/reservations` → select building, type, enter plate → submit | Reservation appears PENDING with slot code |
| D-03 | Cancel reservation | Click Cancel on pending reservation | Status → CANCELLED, slot freed |
| D-04 | View active session | After staff checks in driver's plate | Session card with plate, slot, duration, QR |
| D-05 | View ticket QR | Active session → QR loads | PNG image displayed (authenticated blob) |
| D-06 | Pay online | Pending payment → select ONLINE → submit | Payment SETTLED |
| D-07 | View session history | `/sessions` | Past sessions with charges shown |

### 3.4 Staff

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| S-01 | Check in — auto | `/check-in` → plate + type + Auto + building → submit | Session created, "Auto-allocated" badge, slot shown |
| S-02 | Check in — manual | Manual mode → building → floor → slot → submit | Session created, "Manual" badge |
| S-03 | Check in — no slots | All slots occupied → try auto | Error "No available slots" |
| S-04 | View active sessions | `/active-sessions` | List of all ACTIVE sessions |
| S-05 | Check out | Click check-out on active session | Session COMPLETED, charge calculated |
| S-06 | Check out — grace | Check out within grace period | Charge = 0 |
| S-07 | Check out — daily cap | Long session exceeds cap | Charge capped at daily max |
| S-08 | Settle payment — cash | `/payments` → select pending → CASH → settle | Payment SETTLED |
| S-09 | Void payment | Enter reason → void | Payment VOIDED |
| S-10 | Report exception | `/exceptions` → type + desc → submit | Exception in open list |
| S-11 | Resolve exception | Enter resolution note → resolve | Exception removed from open list |

### 3.5 Manager

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| M-01 | Create building | `/buildings` → name + address → create | Building in list |
| M-02 | Add floor | Select building → level + name → create | Floor in building |
| M-03 | Assign floor type | Set vehicle type on floor | Floor shows type |
| M-04 | Add slot | Select floor → code → create | Slot AVAILABLE |
| M-05 | Lock slot | Change status to LOCKED | Slot shows LOCKED |
| M-06 | Create vehicle type | `/pricing` → name → create | Type in list |
| M-07 | Set pricing | Rate + grace + cap → save | Policy active |
| M-08 | Overview dashboard | `/overview` | Summary cards with counts |
| M-09 | Analytics charts | `/analytics` → select date range | Charts render with data |
| M-10 | Duplicate floor level | Same level in same building | Error "Floor level already exists" |
| M-11 | Issue monthly pass | `/passes` → plate + type + dates → create | Pass in list, status ACTIVE |
| M-12 | Overlapping pass rejected | Same plate + type + overlapping dates | Error "Overlapping active pass" |
| M-13 | Revoke pass | Click revoke on active pass | Pass removed, free exit no longer applies |
| M-14 | Free exit with pass | Check out vehicle with active pass | Zero charge, session completes immediately |

### 3.6 Admin

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| X-01 | Create user | `/users` → email + pass + name + role → create | User in list |
| X-02 | Change role | Change dropdown on user row | Role updated |
| X-03 | Deactivate user | Click "Deactivate" | User shows "Inactive" badge |
| X-04 | Reactivate user | Click "Activate" on inactive user | User active again |

### 3.7 Cross-role (end-to-end)

| TC | Scenario | Steps | Expected |
|---|---|---|---|
| E-01 | Full parking lifecycle | Manager creates infra → Driver reserves → Staff checks in → time passes → Staff checks out → Staff settles payment | All statuses correct at each step |
| E-02 | Exception flow | Driver loses ticket → Staff reports LOST_TICKET → Staff resolves → manual check-out | Exception resolved, session completed |
| E-03 | AI vs Manual comparison | Check in 5 auto, 5 manual → view allocation comparison report | Chart shows both methods with counts |
| E-04 | Monthly pass lifecycle | Manager issues pass → Staff checks in vehicle → Staff checks out → verify zero charge | Free exit, no payment record |
| E-05 | Two-phase checkout | Staff checks out (no pass) → session AWAITING_PAYMENT → Staff settles → session COMPLETED, slot AVAILABLE | Status transitions correct |

---

## 4. Test Data

Dev seed profile provides:
- 1 user per role (admin/manager/staff/driver)
- 1 building with 3 floors, 24 slots
- 3 vehicle types with pricing
- Sample sessions and payments

Seed endpoint or Flyway seed migration loads on dev profile startup.

---

## 5. Defect Severity

| Severity | Definition | Example |
|---|---|---|
| Critical | Feature completely broken, no workaround | Login fails, check-in crashes |
| Major | Feature works incorrectly | Wrong charge calculation, role access bypass |
| Minor | Cosmetic or UX issue | Misaligned layout, missing empty state |
| Low | Enhancement or edge case | Better error message wording |

---

## 6. Test Environment

| Component | Dev | Deploy |
|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel |
| Backend | `localhost:5000` (Spring Boot) | Render |
| Database | Local PostgreSQL | Neon |
| Browser | Chrome latest | Chrome, Firefox, Safari |
