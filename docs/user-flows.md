# User Flows — ParkMaster

Step-by-step flows per role. Use as hand-testing script and presentation reference.

---

## Guest (no auth)

### GF-1: Discover ParkMaster
1. Open landing page (`/`)
2. See hero: tagline, live slot map preview, status legend
3. Scroll to AI Allocation Showcase — see how scoring works (RQ2-RQ4 demo)
4. Scroll to role descriptions (Manager, Staff, Driver)
5. Click "Let it park you" CTA or "Sign in" header link

### GF-2: View live availability
1. Landing page loads public building list (`GET /api/public/buildings`)
2. See available slot count per building (`GET /api/public/buildings/{id}/availability`)

### GF-3: View pricing
1. Landing page / public pricing section (`GET /api/public/pricing`)
2. See per-vehicle-type rate: hourly, grace period, daily cap

---

## Driver (USER role)

### DF-1: Register
1. Click "Let it park you" or navigate to `/signup`
2. Fill: full name, email, password (min 8 chars)
3. Submit → `POST /api/auth/register`
4. Auto-assigned USER role, receive JWT
5. Redirect to driver dashboard (`/parking`)

### DF-2: Login
1. Navigate to `/login`
2. Enter email + password
3. Submit → `POST /api/auth/login`
4. JWT + user object stored in localStorage
5. Redirect to role-appropriate dashboard

### DF-3: Reserve a slot
1. Open Reservations page (`/reservations`)
2. Select building (dropdown) + vehicle type (dropdown) + enter license plate
3. Submit → `POST /api/driver/reservations`
4. System auto-allocates best slot via AI scoring
5. Reservation appears in list with status PENDING
6. Help text: "held for 30 min — drive in and staff checks you in"
7. Can cancel while PENDING → `POST /api/driver/reservations/{id}/cancel`

### DF-4: View active session
1. Open My Parking page (`/parking`)
2. See active session card: plate, slot, check-in time, duration, running charge
3. View ticket QR code (authenticated PNG blob)
4. Session updates: ACTIVE → checked out by staff

### DF-5: View session history
1. Open My Sessions page (`/sessions`)
2. See past sessions: plate, slot, duration, charge, status
3. Each session shows auto-allocated vs manual pick

### DF-6: Pay for session
1. Open My Parking or see payment notification
2. View pending payment: amount, session details
3. Select payment method (ONLINE)
4. Submit → `POST /api/driver/payments/{id}/pay`
5. Payment status: PENDING → SETTLED

---

## Staff (STAFF role)

### SF-1: Check in — auto-allocate
1. Open Check In page (`/check-in`)
2. Enter license plate
3. Select vehicle type (dropdown)
4. Choose "Auto-allocate" mode (default)
5. Select building (dropdown)
6. Submit → `POST /api/staff/sessions/check-in` (no slotId → auto)
7. System scores all available slots, picks highest score
8. Success card: plate, slot ID, session number, "Auto-allocated" badge

### SF-2: Check in — manual pick
1. Open Check In page
2. Enter plate + select vehicle type
3. Choose "Manual pick" mode
4. Select building → floors load → select floor → available slots load
5. Select specific slot
6. Submit → `POST /api/staff/sessions/check-in` (with slotId)
7. Success card: plate, slot, session, "Manual" badge

### SF-3: Check out
1. Open Active Sessions page
2. See list of all active sessions (`GET /api/staff/sessions/active`)
3. Find session by plate or scan ticket
4. Click "Check out" → `POST /api/staff/sessions/{id}/check-out`
5. Charge calculated; if active monthly pass → zero charge, session completes immediately, slot freed
6. Otherwise: session → AWAITING_PAYMENT, slot stays OCCUPIED, payment record created (PENDING)
7. Staff settles payment → session → COMPLETED, slot → AVAILABLE

### SF-4: Look up by ticket code
1. Scan ticket QR or enter ticket code
2. `GET /api/staff/sessions/by-ticket/{ticketCode}`
3. Session details returned → proceed to check out

### SF-5: Settle payment at gate
1. Open Payments page
2. See pending payments list (`GET /api/staff/payments/pending`)
3. Select payment → choose method (CASH / CARD / ONLINE)
4. Submit → `POST /api/staff/payments/{id}/settle`
5. Payment status: PENDING → SETTLED

### SF-6: Void payment
1. Open Payments page
2. Find payment to void
3. Enter reason
4. Submit → `POST /api/staff/payments/{id}/void`
5. Payment status: PENDING → VOIDED

### SF-7: Report exception
1. Open Exceptions page
2. Fill form: type (lost ticket / wrong plate / overtime / wrong zone), description, optional session ID
3. Submit → `POST /api/staff/exceptions`
4. Exception appears in open list

### SF-8: Resolve exception
1. Open Exceptions page
2. See open exceptions list (`GET /api/staff/exceptions/open`)
3. Enter resolution note on exception card
4. Click "Resolve" → `POST /api/staff/exceptions/{id}/resolve`
5. Exception marked resolved, removed from open list

---

## Manager (MANAGER role)

### MF-1: Manage buildings
1. Open Buildings page (`/buildings`)
2. Create building: name + address → `POST /api/manager/buildings`
3. Edit building → `PUT /api/manager/buildings/{id}`
4. Delete building → `DELETE /api/manager/buildings/{id}`

### MF-2: Manage floors
1. Select building on Buildings page
2. View floors for building (`GET /api/manager/buildings/{id}/floors`)
3. Create floor: level + name → `POST /api/manager/buildings/{id}/floors`
4. Assign vehicle type to floor → `PATCH /api/manager/floors/{id}/vehicle-type`
5. Delete floor → `DELETE /api/manager/floors/{id}`

### MF-3: Manage slots
1. Select floor on Buildings page
2. View slots for floor (`GET /api/manager/floors/{id}/slots`)
3. Create slot: code → `POST /api/manager/floors/{id}/slots`
4. Change slot status (AVAILABLE / MAINTENANCE / LOCKED) → `PATCH /api/manager/slots/{id}/status`
5. Delete slot → `DELETE /api/manager/slots/{id}`

### MF-4: Manage vehicle types + pricing
1. Open Pricing page (`/pricing`)
2. Create vehicle type: name → `POST /api/manager/vehicle-types`
3. Set pricing policy: hourly rate, grace minutes, daily cap → `PUT /api/manager/vehicle-types/{id}/pricing`
4. View all pricing policies → `GET /api/manager/pricing`
5. Delete vehicle type → `DELETE /api/manager/vehicle-types/{id}`

### MF-5: Manage monthly passes
1. Open Passes page (`/passes`)
2. Issue pass: license plate, vehicle type, start date, end date → `POST /api/manager/passes`
3. View all passes → `GET /api/manager/passes` (filter by status)
4. View single pass → `GET /api/manager/passes/{id}`
5. Revoke pass → `DELETE /api/manager/passes/{id}`

### MF-6: View analytics dashboard
1. Open Overview page (`/overview`)
2. See summary cards: total buildings, slots, active sessions, revenue
3. See floor fill-rate analytics (`GET /api/manager/buildings/{id}/analytics/allocation`)

### MF-7: View reports
1. Open Analytics page (`/analytics`)
2. Select date range
3. View charts:
   - Revenue daily trend (`GET /api/manager/reports/revenue-daily`)
   - Revenue by vehicle type (`GET /api/manager/reports/revenue-by-vehicle-type`)
   - Check-ins by hour (`GET /api/manager/reports/check-ins-by-hour`)
   - Duration by vehicle type (`GET /api/manager/reports/duration-by-vehicle-type`)
   - Auto vs manual allocation comparison (`GET /api/manager/reports/allocation-comparison`)

---

## Admin (ADMIN role)

### AF-1: Create user account
1. Open Users page (`/users`)
2. Fill form: email, password (min 8), full name, role (ADMIN / MANAGER / STAFF / USER)
3. Submit → `POST /api/admin/users`
4. New user appears in list

### AF-2: Change user role
1. Open Users page
2. Find user in list
3. Change role dropdown → `PATCH /api/admin/users/{id}/role`
4. Role updated immediately

### AF-3: Deactivate / reactivate user
1. Open Users page
2. Click "Deactivate" on active user → `PATCH /api/admin/users/{id}/active` (active: false)
3. User shows "Inactive" badge, can no longer log in
4. Click "Activate" to re-enable → same endpoint (active: true)

---

## Cross-role flows

### XF-1: Full parking lifecycle
1. **Manager** creates building → floors → slots, sets pricing
2. **Driver** registers, reserves a slot (AI auto-allocates)
3. **Driver** arrives at building
4. **Staff** checks in driver (against reservation or walk-in)
5. Ticket QR generated, **driver** views on phone
6. **Driver** parks, time passes
7. **Driver** ready to leave
8. **Staff** scans ticket or finds session, checks out
9. Charge calculated (hourly rate x duration, grace period, daily cap)
10. If **driver** has active monthly pass → zero charge, session completes immediately, slot freed
11. Otherwise: session → AWAITING_PAYMENT, slot stays OCCUPIED, payment created as PENDING
12. **Staff** settles at gate (cash/card) OR **driver** pays online
13. Payment settled → session complete, slot freed

### XF-2: Exception handling
1. **Driver** loses ticket
2. **Staff** logs exception (type: LOST_TICKET, links session ID)
3. **Staff** or **Manager** resolves: verifies plate, adds resolution note
4. **Staff** checks out session manually, settles payment

### XF-3: AI allocation showcase (RQ2-RQ4)
1. **Guest** visits landing page
2. Allocation Showcase fetches live scores (`GET /api/public/buildings/{id}/allocation-preview`)
3. Shows top candidates with score breakdown:
   - Vehicle type match (40 pts)
   - Load balance (30 pts)
   - Distance to entry (20 pts)
   - Peak hour bonus (10 pts)
4. Demonstrates WHY slot A beats slot B — answers research questions
