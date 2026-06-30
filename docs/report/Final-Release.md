# ParkMaster

**Final Release Document**

– Ho Chi Minh City, version 1.0 –

**Table of Contents**

- [I. Deliverable Package](#i-deliverable-package)
- [II. Installation Guides](#ii-installation-guides)

---

# I. Deliverable Package

Group/project code: `PM_SU26SWP08` (Parking Building Management System, SWP391).

| No. | File | Notes |
|---|---|---|
| 1 | `PM_SU26SWP08_DB_final.sql` | Final database dump — table structures + seed/sample data |
| 2 | `PM_SU26SWP08_DB_schema.sql` | Database schema only — table structures, no data |
| 3 | `PM_SU26SWP08_SRS_final.docx` | Final SRS (Requirement) Document — source: `docs/report/SRS.md` |
| 4 | `PM_SU26SWP08_SDS_final.docx` | Final SDS (Design) Document — source: `docs/report/SDS.md` |
| 5 | `PM_SU26SWP08_Final_Release.docx` | This document — source: `docs/report/Final-Release.md` |
| 6 | `PM_SU26SWP08_AI_Usage.xlsx` | AI usage log — source: `docs/report/AI-Usage.md` |
| 7 | `PM_SU26SWP08_v1.0` | Git tag marking the final release commit |

Other related deliverables:

- Source code: [github.com/duu261/Parking-Building-Management-System](https://github.com/duu261/Parking-Building-Management-System)
- Release tag: `PM_SU26SWP08-v1.0` *(create at release time: `git tag PM_SU26SWP08-v1.0 && git push origin PM_SU26SWP08-v1.0`)*
- Demonstration video: `<< add link before submission >>`

---

# II. Installation Guides

## Prerequisites

| Tool | Version |
|---|---|
| JDK | 21+ (system default JDK 23 also builds/runs fine; source/target stays 21) |
| Node.js | LTS (for Vite 5 / React 19) |
| Docker | for local PostgreSQL via `docker-compose.yml` |
| Maven | bundled via `mvnd` (Maven Daemon) — `mvn` is aliased to `mvnd`, no separate install needed |

## 1. Database Setup (Docker)

The repo root ships a `docker-compose.yml` that starts PostgreSQL 16
pre-configured for the backend (`db: parkmaster`, `user: parkmaster`,
`password: parkmaster`, port `5432`):

```bash
docker compose up -d db
```

Schema is Flyway-owned (`ddl-auto: validate`) — migrations live in
`backend/src/main/resources/db/migration/V*.sql` and apply automatically on
backend startup. No manual `psql` restore is needed for a fresh local
install; the provided `.sql` dumps (`PM_SU26SWP08_DB_final.sql` /
`PM_SU26SWP08_DB_schema.sql`) are deliverable artifacts for grading /
inspection, or for restoring into an external Postgres instance:

```bash
psql -h localhost -U parkmaster -d parkmaster -f PM_SU26SWP08_DB_final.sql
```

## 2. Backend Setup

```bash
cd backend
# DB connection defaults match docker-compose.yml; override via
# DB_URL, DB_USERNAME, DB_PASSWORD, PARKMASTER_JWT_SECRET if needed
mvnd spring-boot:run
```

- Runs on **port 5000**.
- Run tests: `mvnd test`.
- Set `SPRING_PROFILES_ACTIVE=dev` to enable the dev seeder (seeds 2 buildings,
  6 floors, 86 slots, 5 active sessions, 30 days of historical data).
- Health check: `GET http://localhost:5000/api/public/health`.

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Dev server runs on **port 5173**, proxies `/api/*` to `http://localhost:5000`
  (configurable in `vite.config.js`).
- Override API base URL with the `VITE_API_URL` environment variable.
- Production build: `npm run build`.

## 4. Demo Logins (dev seed data)

| Role | Email | Password |
|---|---|---|
| Admin | admin@parkmaster.dev | password123 |
| Manager | manager@parkmaster.dev | password123 |
| Staff | staff@parkmaster.dev | password123 |
| Driver | driver@parkmaster.dev | password123 |

## 5. Production Deployment (reference)

Live demo stack: **Vercel** (frontend) + **Render** (backend, Docker) +
**Neon** (Postgres), tracking the `deploy` branch. Full step-by-step
environment-variable setup: see `docs/DEPLOY.md` in the source repository.

# III. User Manual

## 1. Overview

ParkMaster manages multi-building parking: drivers reserve or walk in,
staff check vehicles in/out at the gate, managers configure buildings/
pricing and review analytics, and admins manage user accounts. Four key
workflows cover the system end to end:

1. **Driver** — reserve a slot, park, and pay.
2. **Staff** — check a vehicle in and out at the gate.
3. **Manager** — set up a building (floors/slots) and pricing.
4. **Admin** — manage user accounts and roles.

Each workflow below maps to screens listed in `report-facts.md` §3 and
SRS §2.1.

## 2. Driver: Reserve → Park → Pay

Screens: `ReservationsPage`, `MyParkingPage`, `PassesPage`.

1. Log in as a Driver (`USER` role) at **LoginPage**.
   > [SCREENSHOT: LoginPage]
2. Open **ReservationsPage** (`/app` → Reservations). Choose a tier:
   - **Free** — AI assigns the slot automatically; 10% fare discount.
   - **Paid** — pick an exact slot from the AI-recommended pick or the
     availability grid; guarantees that slot.
   > [SCREENSHOT: ReservationsPage — tier toggle and slot picker]
3. Fill **Building**, **Vehicle type**, **License plate**, and **Arrival
   time** (quick-pick chips: +30min … +180min).
4. Submit:
   - Free tier → `Reserve (Free)`, reservation appears under "Your
     reservations" as `PENDING`, with a QR code to show staff at check-in.
   - Paid tier → `Reserve & Pay Deposit`; redirected to VNPay to pay the
     deposit (1-hour rate) before the slot is confirmed.
   > [SCREENSHOT: Reservation card with QR code]
5. At the gate, staff scans the reservation QR (see Workflow 3 below) to
   check the vehicle in.
6. While parked, the driver can track status on **MyParkingPage** and
   session history on **MySessionsPage**.
7. At checkout, if no active monthly pass covers the vehicle, the driver
   pays via VNPay (or staff settles cash on-site) — see Workflow 3.
8. To skip per-session payment, the driver can register a **Monthly
   Pass** on **PassesPage**: select vehicle type, license plate, and
   start date (end date auto-fills +1 month), then `Register` and pay
   via VNPay. An `ACTIVE` pass zeroes the checkout charge for that
   vehicle type.
   > [SCREENSHOT: PassesPage — register pass form]
9. Cancel a pending reservation anytime via the `Cancel` button on its
   card.

## 3. Staff: Check-In / Check-Out

Screens: `CheckInPage` (Gate Operations), `ActiveSessionsPage`.

1. Log in as Staff. Land on **CheckInPage**, which has two tabs:
   **Scan/Lookup** and **Walk-in Check In**.
   > [SCREENSHOT: CheckInPage tabs]
2. **Check a reservation/pass holder in (Scan/Lookup tab):**
   - Scan the driver's QR with the camera button, or type the ticket
     code / license plate / `RES:<id>` / `PASS:<plate>` into the search
     box.
   - A monthly-pass QR shows a green "Monthly Pass Holder" panel — pick
     the **Building** and click `Check in with pass` (AI auto-allocates
     the slot).
   - A reservation QR (`RES:`) checks the vehicle in immediately.
   > [SCREENSHOT: Scan result — pass holder check-in]
3. **Walk-in vehicle (Walk-in Check In tab):**
   - Enter **License plate** (auto-detects an existing monthly pass) and
     **Vehicle type**.
   - Choose **AI Auto** (pick Building, AI assigns the best slot — shown
     with a score breakdown) or **Manual Slot** (pick Building → Floor →
     an available slot tile).
   - Click `Check in`. The session, ticket code, and assigned slot are
     shown on success.
   > [SCREENSHOT: Walk-in Check In form — AI Auto mode]
4. **Check a vehicle out:**
   - On **ActiveSessionsPage**, find the session (search by plate,
     building, floor, or slot) and click `Check out` — or from the
     Scan/Lookup result card.
   - `ChargeCalculator` computes the amount due. If a payment is owed,
     a panel shows the amount with a `Settle Cash` button (or the
     driver pays via VNPay on their phone); an active monthly pass
     zeroes the charge and completes the session immediately.
   > [SCREENSHOT: ActiveSessionsPage — checkout amount due panel]
5. The slot map at the bottom of **ActiveSessionsPage** shows live
   occupancy across floors.

## 4. Manager: Building & Pricing Setup

Screens: `BuildingsPage`, `system/PricingPage`.

1. Log in as Manager. Open **BuildingsPage**.
2. **Create a building:** fill **Name** and **Address**, click `Add
   building`.
   > [SCREENSHOT: BuildingsPage — add building form]
3. **Add floors:** select the building to expand it, then under
   "Floors" enter **Level** and **Name** (e.g. Ground, B1), click
   `Add floor`. Optionally assign a **vehicle type** to segment the
   floor (e.g. motorbike-only).
4. **Add slots:** expand a floor, enter a **Slot code** (e.g. `A-01`),
   click `Add slot`. Change a slot's status via its dropdown
   (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `LOCKED`).
   > [SCREENSHOT: FloorsPanel — slot grid with status dropdown]
5. View **Floor utilization** (fill-rate bars) below the building list
   once a building is selected — answers RQ1/RQ4 at a glance.
6. **Set pricing:** open **System PricingPage**. Add a vehicle type
   (**Name**, **Description**), then on its card set **Rate / hour**,
   **Daily cap**, **Grace (min)**, **Peak multiplier**, and **Monthly
   pass price**, then `Set pricing` / `Update pricing`.
   > [SCREENSHOT: PricingPage — vehicle type pricing card]

## 5. Admin: User Management

Screen: `UsersPage`.

1. Log in as Admin. Open **UsersPage**.
2. **Create an account:** fill **Email**, **Password** (min 8 chars),
   **Full name**, choose a **Role** (`ADMIN`/`MANAGER`/`STAFF`/`USER`),
   click `Add user`.
   > [SCREENSHOT: UsersPage — add user form]
3. **Change a user's role:** use the role dropdown on their row —
   updates immediately.
4. **Activate/deactivate:** click `Activate`/`Deactivate` on a user's
   row to toggle account access.
5. Filter by role chip (`All`/`ADMIN`/`MANAGER`/`STAFF`/`USER`) or
   search by name/email.
   > [SCREENSHOT: UsersPage — role filter and user list]
