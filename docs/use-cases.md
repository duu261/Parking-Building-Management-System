# Use Cases — ParkMaster

Formal use case descriptions derived from user flows. SWP391 format.

---

## Actors

| Actor | Description |
|---|---|
| **Guest** | Unauthenticated visitor browsing public info |
| **Driver** | Registered user (USER role) who parks vehicles |
| **Staff** | Gate operator handling check-in/out and payments |
| **Manager** | Building administrator managing infrastructure and analytics |
| **Admin** | System administrator managing user accounts and roles |
| **System** | ParkMaster backend (AI allocation, charge calculation, auto-expiry) |

---

## UC-01: Register Account

| Field | Value |
|---|---|
| Actor | Guest |
| Precondition | Guest is not logged in |
| Trigger | Guest clicks "Let it park you" or navigates to sign-up |
| Main flow | 1. Guest enters full name, email, password (min 8 chars) |
| | 2. System validates input (unique email, password strength) |
| | 3. System creates account with USER role |
| | 4. System returns JWT token |
| | 5. Guest becomes Driver, redirected to dashboard |
| Postcondition | Account exists, user is authenticated |
| Exception | E1: Email already registered → error "Email already in use" |
| | E2: Password too short → validation error |

---

## UC-02: Login

| Field | Value |
|---|---|
| Actor | Driver, Staff, Manager, Admin |
| Precondition | Account exists and is active |
| Trigger | User navigates to login page |
| Main flow | 1. User enters email + password |
| | 2. System verifies credentials |
| | 3. System returns JWT + user object (id, email, role) |
| | 4. Frontend stores token, redirects to role-appropriate dashboard |
| Postcondition | User is authenticated with valid JWT |
| Exception | E1: Wrong credentials → "Invalid email or password" |
| | E2: Account deactivated → login rejected |

---

## UC-03: Reserve a Slot

| Field | Value |
|---|---|
| Actor | Driver |
| Precondition | Driver is logged in |
| Trigger | Driver opens Reservations page |
| Main flow | 1. Driver selects building from list |
| | 2. Driver selects vehicle type |
| | 3. Driver enters license plate |
| | 4. System runs AI slot allocation (weighted scoring) |
| | 5. System assigns best-scoring available slot |
| | 6. Slot status changes to RESERVED |
| | 7. Reservation created with status PENDING, 30-min hold |
| | 8. Driver sees reservation in list with slot code |
| Postcondition | Slot reserved, hold timer started |
| Exception | E1: No available slots → error "No slots available" |
| | E2: Invalid building/type → validation error |
| Alt flow | A1: Driver cancels pending reservation → slot freed, status CANCELLED |

---

## UC-04: Check In Vehicle (Auto-allocate)

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Staff is logged in, building has available slots |
| Trigger | Vehicle arrives at gate |
| Main flow | 1. Staff enters license plate |
| | 2. Staff selects vehicle type |
| | 3. Staff selects "Auto-allocate" mode |
| | 4. Staff selects building |
| | 5. System runs AI allocation: scores all available slots |
| | 6. System picks highest-scoring slot |
| | 7. Slot status → OCCUPIED, session created (ACTIVE) |
| | 8. Ticket code generated (QR) |
| | 9. Staff sees success: plate, slot, session ID, "Auto-allocated" |
| Postcondition | Session active, slot occupied, ticket exists |
| Exception | E1: No available slots in building → error |
| Alt flow | A1: Vehicle has pending reservation → system matches and checks in against it |

---

## UC-05: Check In Vehicle (Manual Pick)

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Staff is logged in |
| Trigger | Vehicle arrives, staff wants specific slot |
| Main flow | 1. Staff enters license plate + vehicle type |
| | 2. Staff selects "Manual pick" mode |
| | 3. Staff selects building → floors load |
| | 4. Staff selects floor → available slots load |
| | 5. Staff picks specific slot |
| | 6. Slot status → OCCUPIED, session created |
| | 7. Ticket code generated |
| Postcondition | Session active, chosen slot occupied |
| Exception | E1: Selected slot no longer available → error |

---

## UC-06: Check Out Vehicle

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Active session exists |
| Trigger | Vehicle leaving, staff processes exit |
| Main flow | 1. Staff opens Active Sessions page |
| | 2. Staff finds session (by plate search or ticket scan) |
| | 3. Staff clicks "Check out" |
| | 4. System calculates charge: hourly rate × duration |
| | 5. Grace period applied (no charge if under threshold) |
| | 6. Daily cap applied (charge capped at maximum) |
| | 7. Payment record created (status PENDING) |
| | 8. Session status → COMPLETED |
| | 9. Slot status → AVAILABLE |
| Postcondition | Session ended, payment pending, slot freed |
| Alt flow | A1: Ticket scan → `GET /by-ticket/{code}` → resolves session → check out |

---

## UC-07: Settle Payment (Staff)

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Pending payment exists |
| Trigger | Driver at gate ready to pay |
| Main flow | 1. Staff opens Payments page |
| | 2. Staff sees pending payments list |
| | 3. Staff selects payment, chooses method (CASH / CARD / ONLINE) |
| | 4. System marks payment SETTLED |
| Postcondition | Payment completed |
| Alt flow | A1: Staff voids payment (with reason) → status VOIDED |

---

## UC-08: Pay Online (Driver)

| Field | Value |
|---|---|
| Actor | Driver |
| Precondition | Driver has pending payment |
| Trigger | Driver views payment on My Parking page |
| Main flow | 1. Driver sees pending payment with amount |
| | 2. Driver selects payment method (ONLINE) |
| | 3. Driver submits payment |
| | 4. System marks payment SETTLED |
| Postcondition | Payment completed |

---

## UC-09: Report Exception

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Staff is logged in |
| Trigger | Incident occurs on floor |
| Main flow | 1. Staff opens Exceptions page |
| | 2. Staff selects exception type (LOST_TICKET / WRONG_PLATE / OVERTIME / WRONG_ZONE) |
| | 3. Staff enters description |
| | 4. Staff optionally links session ID |
| | 5. System creates exception report (status OPEN) |
| Postcondition | Exception logged, visible in open list |

---

## UC-10: Resolve Exception

| Field | Value |
|---|---|
| Actor | Staff |
| Precondition | Open exception exists |
| Trigger | Staff investigates and resolves incident |
| Main flow | 1. Staff opens Exceptions page |
| | 2. Staff finds open exception |
| | 3. Staff enters resolution note |
| | 4. Staff clicks "Resolve" |
| | 5. Exception status → RESOLVED |
| Postcondition | Exception closed |

---

## UC-11: Manage Buildings

| Field | Value |
|---|---|
| Actor | Manager |
| Precondition | Manager is logged in |
| Trigger | Manager needs to set up or modify parking infrastructure |
| Main flow | 1. Manager opens Buildings page |
| | 2. Manager creates building (name + address) |
| | 3. Manager adds floors (level + name) to building |
| | 4. Manager assigns vehicle type to floor (optional, for allocation scoring) |
| | 5. Manager adds slots (code) to floor |
| | 6. Manager sets slot status (AVAILABLE / MAINTENANCE / LOCKED) |
| Postcondition | Building infrastructure configured |
| Alt flow | A1: Edit building name/address |
| | A2: Delete slot / floor / building (cascade) |

---

## UC-12: Manage Pricing

| Field | Value |
|---|---|
| Actor | Manager |
| Precondition | Manager is logged in, vehicle types exist |
| Trigger | Manager sets or updates parking rates |
| Main flow | 1. Manager opens Pricing page |
| | 2. Manager creates vehicle type (e.g., Car, Motorcycle, Truck) |
| | 3. Manager sets pricing policy per type: hourly rate, grace period (minutes), daily cap |
| | 4. Pricing visible publicly and used in charge calculation |
| Postcondition | Pricing policy active |
| Alt flow | A1: Update existing pricing |
| | A2: Delete vehicle type + its policy |

---

## UC-13: View Reports and Analytics

| Field | Value |
|---|---|
| Actor | Manager |
| Precondition | Manager is logged in, sessions/payments exist |
| Trigger | Manager wants operational insights |
| Main flow | 1. Manager opens Overview page — sees summary cards |
| | 2. Manager opens Analytics page |
| | 3. Manager selects date range |
| | 4. System renders charts: |
| | — Revenue daily trend |
| | — Revenue by vehicle type |
| | — Check-ins by hour of day |
| | — Average duration by vehicle type |
| | — Auto vs manual allocation comparison |
| | 5. Manager uses data to answer research questions (RQ1-RQ4) |
| Postcondition | Manager has operational visibility |

---

## UC-14: Manage Users

| Field | Value |
|---|---|
| Actor | Admin |
| Precondition | Admin is logged in |
| Trigger | Admin needs to create accounts or modify access |
| Main flow | 1. Admin opens Users page |
| | 2. Admin creates user: email, password, full name, role |
| | 3. User appears in list |
| Postcondition | User account exists with assigned role |
| Alt flow | A1: Change user role (dropdown) → immediate update |
| | A2: Deactivate user → "Inactive" badge, login blocked |
| | A3: Reactivate user → login restored |

---

## UC-15: View Ticket QR

| Field | Value |
|---|---|
| Actor | Driver |
| Precondition | Driver has active session |
| Trigger | Driver opens My Parking page |
| Main flow | 1. Driver sees active session |
| | 2. System loads ticket QR (authenticated PNG blob) |
| | 3. Driver shows QR to staff at exit |
| Postcondition | QR displayed for scanning |

---

## UC-16: AI Slot Allocation (System)

| Field | Value |
|---|---|
| Actor | System |
| Precondition | Available slots exist in target building |
| Trigger | Check-in (auto mode) or reservation created |
| Main flow | 1. System loads all available slots in building |
| | 2. For each slot, calculate weighted score: |
| | — Vehicle type match (40 pts): floor type matches vehicle? |
| | — Load balance (30 pts): favor emptier floors |
| | — Distance to entry (20 pts): lower floors score higher |
| | — Peak hour bonus (10 pts): extra spread during peak |
| | 3. System selects slot with highest total score |
| | 4. Slot status → OCCUPIED or RESERVED |
| Postcondition | Optimal slot assigned |
| Research link | Answers RQ2 (time-to-park), RQ3 (criteria weights), RQ4 (peak utilization) |

---

## Use Case Diagram (text representation)

```
                    ParkMaster System
 ┌──────────────────────────────────────────────────┐
 │                                                  │
 │  ┌─────────┐  ┌─────────┐  ┌──────────────────┐ │
 │  │ UC-01   │  │ UC-02   │  │ UC-16            │ │
 │  │Register │  │ Login   │  │ AI Allocation    │ │
 │  └────┬────┘  └────┬────┘  │ (system actor)   │ │
 │       │            │       └────────┬─────────┘ │
 │       │            │                │           │
Guest ───┘     All roles              │           │
 │                    │       ┌───────┘           │
 │  ┌─────────┐      │       │                    │
 │  │ UC-03   │◄─────┼───────┤                    │
 │  │Reserve  │ Driver│       │                    │
 │  ├─────────┤      │       │                    │
 │  │ UC-08   │      │       │                    │
 │  │Pay Online│     │       │                    │
 │  ├─────────┤      │       │                    │
 │  │ UC-15   │      │       │                    │
 │  │View QR  │      │       │                    │
 │  └─────────┘      │       │                    │
 │                    │       │                    │
 │  ┌─────────┐      │       │                    │
 │  │ UC-04/05│◄─────┼───────┘                    │
 │  │Check In │ Staff │                            │
 │  ├─────────┤      │                            │
 │  │ UC-06   │      │                            │
 │  │Check Out│      │                            │
 │  ├─────────┤      │                            │
 │  │ UC-07   │      │                            │
 │  │Payments │      │                            │
 │  ├─────────┤      │                            │
 │  │UC-09/10 │      │                            │
 │  │Exceptions│     │                            │
 │  └─────────┘      │                            │
 │                    │                            │
 │  ┌─────────┐      │                            │
 │  │ UC-11   │◄─────┤ Manager                    │
 │  │Buildings│      │                            │
 │  ├─────────┤      │                            │
 │  │ UC-12   │      │                            │
 │  │Pricing  │      │                            │
 │  ├─────────┤      │                            │
 │  │ UC-13   │      │                            │
 │  │Reports  │      │                            │
 │  └─────────┘      │                            │
 │                    │                            │
 │  ┌─────────┐      │                            │
 │  │ UC-14   │◄─────┘ Admin                      │
 │  │Users    │                                    │
 │  └─────────┘                                    │
 │                                                  │
 └──────────────────────────────────────────────────┘
```
