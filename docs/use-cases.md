# Use Cases — ParkMaster

**Last Updated:** 2026-06-24

ParkMaster is a Parking Building Management System for FPT University (SWP391 capstone). It supports five actor roles with distinct use cases grouped by role and functional domain.

---

## Actors Overview

| Actor | Role | Key Responsibilities |
|-------|------|----------------------|
| **Guest** | Unauthenticated | Browse public pricing, check availability, view AI assistant |
| **Driver (USER)** | Registered user | Reserve slots, check in/out, pay bills, purchase monthly passes, submit feedback |
| **Staff** | Gate operator | Check-in/check-out vehicles, manage payments, file exception reports, lookup sessions |
| **Manager** | Building admin | Manage buildings, floors, slots; configure pricing; review payments, passes, exceptions, feedback; view analytics |
| **Admin** | System admin | User account management, role assignment, system-wide permissions |
| **System** | Automated | AI slot allocation, charge calculation, auto-expiry of passes and reservations |

---

## Use Cases by Actor

### GUEST ACTOR

#### UC-G01: View Parking Overview
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Guest navigates to landing page |
| **Main Flow** | 1. System displays public homepage<br>2. Shows parking building locations<br>3. Displays current availability (aggregate slot count)<br>4. Shows fixed pricing rates (per vehicle type) |
| **Postcondition** | Guest has visibility into parking infrastructure |
| **Endpoint** | `GET /api/public/buildings` |

#### UC-G02: Check Available Slots
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Guest views the landing page or searches |
| **Main Flow** | 1. System queries available slots across all buildings<br>2. Aggregates by building and vehicle type<br>3. Returns availability counts with pricing |
| **Postcondition** | Guest sees real-time occupancy |
| **Endpoint** | `GET /api/public/buildings/{id}/availability` |

#### UC-G03: Chat with AI Assistant
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Guest visits landing page |
| **Main Flow** | 1. Guest sends message to AI assistant widget<br>2. System provides info on: parking zones, slot allocation, payments, exceptions, feedback<br>3. AI responds contextually |
| **Postcondition** | Guest receives AI-assisted guidance |
| **Endpoint** | `POST /api/public/assistant/chat` |

---

### DRIVER (USER) ACTOR

#### UC-D01: Register Account
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Visitor is not logged in |
| **Main Flow** | 1. Guest navigates to signup page<br>2. Enters full name, email, password (≥8 chars)<br>3. System validates email uniqueness and password strength<br>4. Creates account with USER role<br>5. Returns JWT token and user object |
| **Postcondition** | Account created, user is authenticated |
| **Exception** | Email already registered → "Email already in use"<br>Password too short → validation error |
| **Endpoint** | `POST /api/auth/register` |

#### UC-D02: Login
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Account exists and is active |
| **Main Flow** | 1. Driver enters email and password<br>2. System verifies credentials<br>3. Returns JWT token and user object (id, email, role)<br>4. Frontend stores token and redirects to driver dashboard |
| **Postcondition** | Driver is authenticated |
| **Exception** | Wrong credentials → "Invalid email or password"<br>Account inactive → login rejected |
| **Endpoint** | `POST /api/auth/login` |

#### UC-D03: View My Parking Sessions
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver is logged in |
| **Main Flow** | 1. Driver opens "My Parking" or sessions page<br>2. System retrieves all sessions for authenticated user<br>3. Displays list with: plate, building, slot, check-in time, status<br>4. Status values: ACTIVE, COMPLETED, AWAITING_PAYMENT |
| **Postcondition** | Driver sees session history |
| **Endpoint** | `GET /api/driver/sessions` |

#### UC-D04: View Session Detail and Ticket QR
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has at least one session |
| **Main Flow** | 1. Driver selects a session from list<br>2. System retrieves full session detail: plate, vehicle type, building, slot, check-in, check-out (if completed), charge<br>3. Displays QR code of ticket (encodes session ID)<br>4. Shows payment status |
| **Postcondition** | Driver sees ticket and session details |
| **Endpoint** | `GET /api/driver/sessions/{id}`<br>`GET /api/driver/sessions/{id}/ticket.png` |

#### UC-D05: Make a Reservation
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver is logged in, building has available slots |
| **Main Flow** | 1. Driver opens Reservations page<br>2. Selects building from dropdown<br>3. Selects vehicle type (car, motorbike)<br>4. Enters license plate<br>5. System runs AI slot allocation (weighted scoring)<br>6. Assigns highest-scoring available slot<br>7. Slot status → RESERVED<br>8. Reservation created with 30-min hold timer<br>9. Driver sees confirmation with slot code and QR |
| **Postcondition** | Slot reserved, hold timer started |
| **Exception** | No available slots → "No slots available"<br>Invalid building/type → validation error |
| **Alt Flow** | A1: Reservation expires after 30 min → slot freed, status EXPIRED |
| **Endpoint** | `POST /api/driver/reservations` |

#### UC-D06: View My Reservations
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has made at least one reservation |
| **Main Flow** | 1. Driver opens Reservations tab<br>2. System retrieves all reservations: PENDING, COMPLETED, CANCELLED, EXPIRED<br>3. Displays slot code, vehicle type, hold timer |
| **Postcondition** | Driver sees active and past reservations |
| **Endpoint** | `GET /api/driver/reservations` |

#### UC-D07: Cancel Reservation
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Reservation exists with status PENDING |
| **Main Flow** | 1. Driver views reservation detail<br>2. Clicks "Cancel"<br>3. System marks reservation CANCELLED<br>4. Slot status → AVAILABLE |
| **Postcondition** | Reservation cancelled, slot freed |
| **Endpoint** | `POST /api/driver/reservations/{id}/cancel` |

#### UC-D08: View My Payments
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has completed at least one parking session |
| **Main Flow** | 1. Driver opens Payments page<br>2. System retrieves all payments for user: PENDING, SETTLED, VOIDED<br>3. Displays amount, method (CASH/CARD/ONLINE/VNPAY), session link<br>4. Shows unpaid balance if any |
| **Postcondition** | Driver sees payment history |
| **Endpoint** | `GET /api/driver/payments` |

#### UC-D09: Pay Online
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has PENDING payment |
| **Main Flow** | 1. Driver opens payment detail<br>2. Selects ONLINE payment method<br>3. System marks payment SETTLED (in local system)<br>4. Session status → COMPLETED if no charge, or payment settled<br>5. Confirmation message displayed |
| **Postcondition** | Payment marked settled |
| **Endpoint** | `POST /api/driver/payments/{id}/pay` |

#### UC-D10: Initiate VNPay Payment
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has PENDING payment, chooses VNPAY method |
| **Main Flow** | 1. Driver clicks "Pay with VNPay"<br>2. System generates VNPay request (amount, order ID)<br>3. Redirects to VNPay gateway<br>4. Driver enters payment details on VNPay<br>5. VNPay redirects back to callback endpoint<br>6. System verifies callback signature<br>7. Marks payment SETTLED<br>8. Session completed, slot freed |
| **Postcondition** | Payment processed, session closed |
| **Endpoint** | `POST /api/payment/vnpay/request`<br>`GET /api/payment/vnpay/callback` (public) |

#### UC-D11: Purchase Monthly Pass
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver is logged in |
| **Main Flow** | 1. Driver opens Monthly Pass page<br>2. Selects vehicle type (car, motorbike)<br>3. Enters license plate<br>4. Clicks "Buy Pass"<br>5. System creates MonthlyPass: status ACTIVE, valid for 30 days<br>6. Records plate, vehicle type, start/end dates<br>7. Driver receives QR code and pass confirmation<br>8. Pass enables free parking for that plate + type combo |
| **Postcondition** | Monthly pass issued and active |
| **Endpoint** | `POST /api/driver/passes` |

#### UC-D12: View My Monthly Passes
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has purchased at least one pass |
| **Main Flow** | 1. Driver opens My Passes tab<br>2. System retrieves all passes for user (active and expired)<br>3. Displays: plate, vehicle type, valid from/to, status (ACTIVE/EXPIRED)<br>4. Shows QR code for each active pass |
| **Postcondition** | Driver sees pass status |
| **Endpoint** | `GET /api/driver/passes` |

#### UC-D13: View Pass QR Code
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has at least one active pass |
| **Main Flow** | 1. Driver selects a pass from list<br>2. System generates and displays QR code (encodes pass ID)<br>3. QR can be scanned by staff at gate |
| **Postcondition** | Driver can show pass proof at gate |
| **Endpoint** | `GET /api/driver/passes/{id}/qr.png` |

#### UC-D14: Submit Parking Feedback
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver has completed a parking session |
| **Main Flow** | 1. Driver views session detail<br>2. Clicks "Leave Feedback"<br>3. Enters rating (1-5 stars) and comment<br>4. System creates feedback record linked to session<br>5. Confirmation displayed |
| **Postcondition** | Feedback recorded |
| **Endpoint** | `POST /api/driver/feedback` |

#### UC-D15: View and Update Profile
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Driver is logged in |
| **Main Flow** | 1. Driver opens Profile page<br>2. Views current info: name, email, phone (if set)<br>3. Can update name, phone<br>4. Saves changes<br>5. System validates and persists |
| **Postcondition** | Profile updated |
| **Endpoint** | `GET /api/driver/profile`<br>`PUT /api/driver/profile` |

---

### STAFF ACTOR

#### UC-S01: Check In Vehicle (Auto-allocate)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Staff is logged in, vehicle arrives at gate |
| **Main Flow** | 1. Staff opens Check-In page<br>2. Enters license plate<br>3. Selects vehicle type (car, motorbike)<br>4. Selects building<br>5. System runs AI allocation: scores all available slots<br>6. System picks highest-scoring slot<br>7. Slot status → OCCUPIED<br>8. Session created with status ACTIVE<br>9. Ticket code generated (QR, encodes session ID)<br>10. Staff sees success: plate, slot code, session ID, "Auto-allocated"<br>11. Driver receives ticket (printout or QR) |
| **Postcondition** | Session active, slot occupied, ticket issued |
| **Exception** | No available slots → "No slots available in this building" |
| **Alt Flow** | A1: Vehicle has pending reservation → system matches and checks in against reservation |
| **Endpoint** | `POST /api/staff/sessions/check-in` |

#### UC-S02: Check Out Vehicle (Calculate Charge)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Active session exists (ACTIVE status) |
| **Main Flow** | 1. Staff opens Active Sessions page<br>2. Staff finds session: by ticket scan, plate search, or session ID<br>3. Clicks "Check Out"<br>4. **Check for Monthly Pass:** System queries active pass (plate + vehicle type + today)<br>5a. **Pass active:** charge = 0, session → COMPLETED, slot → AVAILABLE (free exit)<br>5b. **No pass:** System calculates charge:<br>   - Base rate: hourly rate × duration (hrs)<br>   - Peak surcharge: if check-in was during peak hours, add surcharge<br>   - Grace period: if duration < grace threshold (e.g., 15 min), charge = 0<br>   - Daily cap: charge capped at maximum (e.g., 200K VND)<br>6. Payment record created (method = null initially)<br>7a. **Charge = 0:** session → COMPLETED, slot → AVAILABLE<br>7b. **Charge > 0:** session → AWAITING_PAYMENT, slot stays OCCUPIED (await payment) |
| **Postcondition** | Free exit: session closed, slot freed. Paid exit: payment pending, slot held |
| **Exception** | Session not found → error |
| **Alt Flow** | A1: Staff scans ticket QR → resolves session → checkout<br>A2: Lost ticket → staff searches by plate, verifies vehicle, checks out normally; may file exception |
| **Endpoint** | `POST /api/staff/sessions/{id}/check-out`<br>`GET /api/staff/sessions/by-ticket/{ticketCode}`<br>`GET /api/staff/sessions/by-plate?plate=XYZ` |

#### UC-S03: List Active Sessions
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Staff is logged in |
| **Main Flow** | 1. Staff opens Active Sessions view<br>2. System retrieves all sessions with status ACTIVE<br>3. Displays: plate, vehicle type, slot, building, check-in time<br>4. Shows estimated duration if available |
| **Postcondition** | Staff sees all vehicles currently parked |
| **Endpoint** | `GET /api/staff/sessions/active` |

#### UC-S04: Lookup Session by Ticket
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Staff has a ticket code |
| **Main Flow** | 1. Staff opens Lookup page<br>2. Scans or enters ticket code<br>3. System resolves ticket → session ID<br>4. Displays full session detail |
| **Postcondition** | Session found and displayed |
| **Endpoint** | `GET /api/staff/sessions/by-ticket/{ticketCode}` |

#### UC-S05: Settle Payment
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Payment exists with status PENDING, session is AWAITING_PAYMENT |
| **Main Flow** | 1. Staff opens Pending Payments list<br>2. Staff selects payment<br>3. Staff chooses settlement method: CASH, CARD, ONLINE, or VNPAY<br>4. Clicks "Settle"<br>5. System records method and marks payment SETTLED<br>6. Session status → COMPLETED<br>7. Slot status → AVAILABLE<br>8. Confirmation message with receipt |
| **Postcondition** | Payment completed, session closed, slot freed |
| **Endpoint** | `GET /api/staff/payments/pending`<br>`POST /api/staff/payments/{id}/settle` |

#### UC-S06: Get Payment Detail
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Payment exists |
| **Main Flow** | 1. Staff selects a payment from list<br>2. System returns: amount, session detail, status, dates |
| **Postcondition** | Staff sees full payment breakdown |
| **Endpoint** | `GET /api/staff/payments/{id}` |

#### UC-S07: Void Payment
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Payment exists with status PENDING or SETTLED |
| **Main Flow** | 1. Staff opens payment detail<br>2. Clicks "Void Payment"<br>3. Enters reason (e.g., "system error", "driver appeal")<br>4. Confirms action<br>5. System marks payment VOIDED<br>6. Session → COMPLETED, slot → AVAILABLE<br>7. Audit log records who voided it and reason |
| **Postcondition** | Payment voided, vehicle released |
| **Endpoint** | `POST /api/staff/payments/{id}/void` |

#### UC-S08: File Exception Report
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Staff encounters an issue during check-in/out |
| **Main Flow** | 1. Staff opens Exception Report page<br>2. Selects exception type: LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE<br>3. Enters plate, vehicle type, building, details<br>4. Optionally links to existing session<br>5. Clicks "Submit"<br>6. System creates exception report with status PENDING<br>7. Notification sent to manager |
| **Postcondition** | Exception logged for manager review |
| **Endpoint** | `POST /api/staff/exceptions` |

---

### MANAGER ACTOR

#### UC-M01: Manage Buildings (CRUD)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Manager is logged in |
| **Main Flow** | 1. Manager opens Buildings page<br>2. Views list of buildings with floor/slot counts<br>3. **Create:** clicks "Add Building", enters name, location, description, saves<br>4. **Update:** selects building, edits fields, saves<br>5. **Delete:** soft-delete building (disabled, slots inaccessible)<br>6. System persists changes |
| **Postcondition** | Building inventory updated |
| **Endpoint** | `POST /api/manager/buildings`<br>`GET /api/manager/buildings`<br>`PUT /api/manager/buildings/{id}`<br>`DELETE /api/manager/buildings/{id}` |

#### UC-M02: Manage Floors (CRUD)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Building exists |
| **Main Flow** | 1. Manager selects building from Buildings page<br>2. Views floors for that building<br>3. **Create:** enters floor number, type (e.g., "A-car", "B-motorbike"), saves<br>4. **Update:** edits floor type or designation<br>5. **Delete:** soft-delete floor<br>6. System updates floor assignments |
| **Postcondition** | Floor structure updated |
| **Endpoint** | `POST /api/manager/floors`<br>`GET /api/manager/buildings/{buildingId}/floors`<br>`PUT /api/manager/floors/{id}`<br>`DELETE /api/manager/floors/{id}` |

#### UC-M03: Manage Parking Slots (CRUD)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Floor exists |
| **Main Flow** | 1. Manager selects floor<br>2. Views all slots for that floor<br>3. **Create:** enters slot code (e.g., "A-01-001"), vehicle type, status, saves<br>4. **Update:** edits slot code, vehicle type, or status (AVAILABLE/MAINTENANCE/LOCKED)<br>5. **Delete:** soft-delete slot<br>6. System enforces constraints (e.g., slot code uniqueness per floor) |
| **Postcondition** | Slot inventory updated |
| **Endpoint** | `POST /api/manager/floors/{floorId}/slots`<br>`GET /api/manager/slots`<br>`PUT /api/manager/slots/{id}`<br>`DELETE /api/manager/slots/{id}` |

#### UC-M04: Configure Pricing Policies
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Manager is logged in |
| **Main Flow** | 1. Manager opens Pricing page<br>2. Views pricing policies per vehicle type (car, motorbike)<br>3. For each type, edits:<br>   - Hourly rate (e.g., 50K VND/hr)<br>   - Peak-hour surcharge (e.g., 10K VND, 07:00-09:00 & 17:00-19:00)<br>   - Grace period (e.g., 15 min free)<br>   - Daily cap (e.g., 200K VND max charge/day)<br>4. Saves policy, effective immediately |
| **Postcondition** | Pricing rules updated for future charges |
| **Endpoint** | `POST /api/manager/pricing`<br>`GET /api/manager/pricing`<br>`PUT /api/manager/pricing/{id}` |

#### UC-M05: View Pending Payments
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Manager is logged in |
| **Main Flow** | 1. Manager opens Payments Analytics<br>2. Filters PENDING payments<br>3. Views: amount, driver, session, time, status<br>4. Can drill into detail or send reminder to staff |
| **Postcondition** | Manager sees payment backlog |
| **Endpoint** | `GET /api/manager/payments/pending` |

#### UC-M06: Manage Monthly Passes
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Manager is logged in |
| **Main Flow** | 1. Manager opens Monthly Passes page<br>2. Views all passes: ACTIVE, EXPIRED<br>3. **Issue Pass (manual):** enters driver email, plate, vehicle type, duration; clicks issue<br>4. **Revoke Pass:** selects active pass, clicks revoke (status → REVOKED)<br>5. Can bulk-manage passes by batch upload |
| **Postcondition** | Pass inventory managed |
| **Endpoint** | `POST /api/manager/passes`<br>`GET /api/manager/passes`<br>`DELETE /api/manager/passes/{id}` |

#### UC-M07: Review Exception Reports
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Exception reports exist |
| **Main Flow** | 1. Manager opens Exception Reports page<br>2. Filters by type (LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE) or status<br>3. Selects report, views: details, linked session, staff notes<br>4. Takes action:<br>   - Marks RESOLVED: no further action needed<br>   - Assigns COMPENSATE: flag for refund<br>   - Assigns INVESTIGATE: mark for follow-up |
| **Postcondition** | Exception handled and tracked |
| **Endpoint** | `GET /api/manager/exceptions`<br>`POST /api/manager/exceptions/{id}/resolve` |

#### UC-M08: Review Driver Feedback
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Feedback submissions exist |
| **Main Flow** | 1. Manager opens Feedback page<br>2. Filters by rating, date range, or building<br>3. Views all feedback: rating, comment, driver, session date<br>4. Can flag for follow-up or mark as reviewed |
| **Postcondition** | Manager monitors satisfaction trends |
| **Endpoint** | `GET /api/manager/feedback` |

#### UC-M09: View Analytics and Reports
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Manager is logged in |
| **Main Flow** | 1. Manager opens Reports/Analytics page<br>2. System displays:<br>   - **Occupancy:** current fill rate per floor/building<br>   - **Revenue:** daily/monthly total from payments<br>   - **Sessions:** total, average duration, peak hours<br>   - **Passes:** active count, expiry forecast<br>   - **Exceptions:** count by type, resolution rate<br>   - **Feedback:** average rating, top comments<br>3. Can filter by date range, building<br>4. Exports to CSV or PDF |
| **Postcondition** | Manager has business intelligence |
| **Endpoint** | `GET /api/manager/reports/revenue-daily`<br>`GET /api/manager/reports/revenue-by-vehicle-type`<br>`GET /api/manager/reports/check-ins-by-hour`<br>`GET /api/manager/reports/duration-by-vehicle-type`<br>`GET /api/manager/reports/allocation-comparison` |

---

### ADMIN ACTOR

#### UC-A01: Manage User Accounts (CRUD)
| Attribute | Description |
|-----------|-------------|
| **Precondition** | Admin is logged in |
| **Main Flow** | 1. Admin opens Users page<br>2. Views all user accounts (email, name, role, status)<br>3. **Create:** enters email, name, password (auto-generated); assigns role<br>4. **View:** sees user detail (created date, last login)<br>5. **Update:** changes name, role, or status (active/inactive)<br>6. **Deactivate:** marks user inactive (login blocked)<br>7. **Delete:** soft-delete user |
| **Postcondition** | User accounts managed |
| **Endpoint** | `POST /api/admin/users`<br>`GET /api/admin/users`<br>`PUT /api/admin/users/{id}`<br>`DELETE /api/admin/users/{id}` |

#### UC-A02: Assign or Change User Roles
| Attribute | Description |
|-----------|-------------|
| **Precondition** | User account exists |
| **Main Flow** | 1. Admin opens Users page<br>2. Selects a user<br>3. Clicks "Change Role"<br>4. Selects new role (USER, STAFF, MANAGER, ADMIN)<br>5. Confirms change<br>6. System updates user role, effective immediately<br>7. User's JWT will reflect new role on next login |
| **Postcondition** | User role updated |
| **Endpoint** | `PATCH /api/admin/users/{id}/role` |

#### UC-A03: Toggle User Active Status
| Attribute | Description |
|-----------|-------------|
| **Precondition** | User account exists |
| **Main Flow** | 1. Admin selects user from list<br>2. Clicks "Deactivate" or "Activate"<br>3. Confirms action<br>4. System toggles user active flag<br>5. Inactive users cannot login |
| **Postcondition** | User access controlled |
| **Endpoint** | `PATCH /api/admin/users/{id}/active` |

---

### SYSTEM ACTOR (Automated)

#### UC-SYS01: AI Slot Allocation (Auto-assign)
| Attribute | Description |
|-----------|-------------|
| **Trigger** | Check-in (UC-S01) or reservation creation (UC-D05) |
| **Main Flow** | 1. System retrieves all AVAILABLE slots in target building<br>2. For each slot, calculates weighted score:<br>   - **Vehicle type match (40 pts):** Does floor type match vehicle? Full pts if yes, 0 if no<br>   - **Load balance (30 pts):** Calculate floor occupancy; favor emptier floors<br>   - **Distance to entry (20 pts):** Lower floor numbers score higher<br>   - **Peak hour bonus (10 pts):** During peak (07:00-09:00, 17:00-19:00), apply extra spread<br>3. Selects slot with highest total score<br>4. Slot status → OCCUPIED (check-in) or RESERVED (reservation) |
| **Postcondition** | Optimal slot assigned |
| **Research Link** | Answers RQ2 (time-to-park reduction), RQ3 (criteria weighting), RQ4 (peak utilization improvement) |
| **Service** | `SlotAllocationService.allocate(buildingId, vehicleType)` |

#### UC-SYS02: Calculate Charge on Check-Out
| Attribute | Description |
|-----------|-------------|
| **Trigger** | Check-out (UC-S02) |
| **Main Flow** | 1. System retrieves session (check-in time) and applicable pricing policy<br>2. Calculates duration (minutes)<br>3. **Base charge:** (hourly_rate / 60) × duration_mins<br>4. **Peak surcharge:** if check-in during peak hours, add peak_surcharge<br>5. **Grace period:** if duration < grace_mins (e.g., 15 min), charge = 0<br>6. **Daily cap:** if charge > daily_cap_amount, charge = daily_cap_amount<br>7. Returns final charge amount |
| **Postcondition** | Charge calculated, payment record created |
| **Service** | `ChargeCalculator.calculate(session, policy)` |

#### UC-SYS03: Auto-Expiry of Reservations
| Attribute | Description |
|-----------|-------------|
| **Trigger** | Scheduled task (every 5 minutes) |
| **Main Flow** | 1. System queries all PENDING reservations<br>2. For each reservation, checks age (created_at + 30 min)<br>3. If age > 30 min:<br>   - Reservation status → EXPIRED<br>   - Slot status → AVAILABLE<br>4. Audit log records expiry |
| **Postcondition** | Stale reservations cleared, slots freed |
| **Service** | Scheduled task / cron job |

#### UC-SYS04: Auto-Expiry of Monthly Passes
| Attribute | Description |
|-----------|-------------|
| **Trigger** | Scheduled task (daily, midnight) |
| **Main Flow** | 1. System queries all ACTIVE passes<br>2. For each pass, checks valid_to date<br>3. If today > valid_to:<br>   - Pass status → EXPIRED<br>   - Pass can no longer grant free parking |
| **Postcondition** | Expired passes disabled |
| **Service** | Scheduled task / cron job |

#### UC-SYS05: Auto-Mark Session as COMPLETED
| Attribute | Description |
|-----------|-------------|
| **Trigger** | After checkout, when charge = 0 or payment settled |
| **Main Flow** | 1. System checks session status (AWAITING_PAYMENT)<br>2. If payment SETTLED or no charge:<br>   - Session → COMPLETED<br>   - Slot → AVAILABLE<br>3. Logs completion timestamp |
| **Postcondition** | Session finalized |
| **Service** | `ParkingSessionService.markComplete(sessionId)` |

---

## API Summary by Domain

| Domain | Endpoints | Primary Actors |
|--------|-----------|-----------------|
| **Auth** | `/api/auth/register`, `/api/auth/login` | Guest, All roles |
| **Driver Sessions** | `/api/driver/sessions`, `/api/driver/sessions/{id}` | Driver |
| **Staff Sessions** | `/api/staff/sessions/check-in`, `/api/staff/sessions/{id}/check-out`, `/api/staff/sessions/active` | Staff |
| **Reservations** | `/api/driver/reservations`, `/api/driver/reservations/{id}/cancel` | Driver |
| **Payments** | `/api/staff/payments/pending`, `/api/staff/payments/{id}/settle`, `/api/driver/payments` | Staff, Driver |
| **VNPay** | `/api/payment/vnpay/request`, `/api/payment/vnpay/callback` | Driver, System |
| **Monthly Passes** | `/api/driver/passes`, `/api/manager/passes` | Driver, Manager |
| **Buildings** | `/api/manager/buildings`, `/api/manager/floors`, `/api/manager/slots` | Manager |
| **Pricing** | `/api/manager/pricing` | Manager |
| **Exceptions** | `/api/staff/exceptions`, `/api/manager/exceptions` | Staff, Manager |
| **Feedback** | `/api/driver/feedback`, `/api/manager/feedback` | Driver, Manager |
| **Analytics** | `/api/manager/reports/*` | Manager |
| **Users (Admin)** | `/api/admin/users`, `/api/admin/users/{id}/role`, `/api/admin/users/{id}/status` | Admin |
| **Public** | `/api/public/overview`, `/api/public/availability`, `/api/public/assistant/chat`, `/api/public/health` | Guest |

---

## Data State Transitions

### Session States
```
ACTIVE → [Check-out] → AWAITING_PAYMENT → [Settle] → COMPLETED
                   ↓
                 (charge=0) → COMPLETED
```

### Payment States
```
PENDING → [Settle] → SETTLED
       → [Void] → VOIDED
```

### Reservation States
```
PENDING → [Check-in matched] → COMPLETED
       → [Cancel] → CANCELLED
       → [Expire after 30 min] → EXPIRED
```

### Slot States
```
AVAILABLE ↔ [Allocate] ↔ OCCUPIED
        ↔ [Reserve] ↔ RESERVED
        ↔ [Maintenance] ↔ MAINTENANCE
```

### Pass States
```
ACTIVE → [Expire] → EXPIRED
      → [Revoke] → REVOKED
```

---

## Research Questions Alignment

- **RQ1:** How does floor/zone segmentation by vehicle type affect slot utilization?
  - Addressed by UC-M03 (slot management by type) and UC-SYS01 (allocation scoring)

- **RQ2:** Does auto slot allocation reduce time-to-park vs free choice?
  - Addressed by UC-S01 (check-in with auto-allocation) and UC-D05 (reservation with scoring)

- **RQ3:** Which allocation criteria matter most: distance, floor, vehicle type, time, fill rate?
  - Addressed by UC-SYS01 (weighted scoring with 4 criteria)

- **RQ4:** Can the allocation algorithm improve peak-hour utilization?
  - Addressed by UC-SYS01 (peak-hour bonus scoring) and UC-M09 (analytics to measure improvement)

---

**End of Use Cases Document**
