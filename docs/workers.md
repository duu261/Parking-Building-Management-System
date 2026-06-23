# Background Jobs — ParkMaster

**Last Updated:** 2026-06-24

Background jobs handle asynchronous, time-based operations in the parking system.

---

## Scheduler Configuration

- **Framework:** Spring Scheduling (`@Scheduled`, `@EnableScheduling`)
- **Thread Pool:** Configured in `application.yml`
- **Timezone:** UTC

---

## Jobs

### Reservation Expiry Job

**Package:** `com.parkmaster.reservation`  
**Class:** `ReservationExpiryJob`

**Schedule:** Runs every 5 minutes (configurable via `@Scheduled(fixedDelay = ...`)

**Purpose:** Automatically expire pending reservations that have exceeded their TTL.

**Logic:**
1. Query all `PENDING` reservations
2. Check if `createdAt + TTL` is in the past
3. Mark as `EXPIRED` in the database
4. Free up any reserved slots for re-allocation

**Database Tables:** `reservations`

**Related Entities:**
- `Reservation` (status: `PENDING`, `FULFILLED`, `CANCELLED`, `EXPIRED`)
- `ParkingSlot` (released from reservation when expired)

**Configuration Parameters:**
- `job.reservation.ttl.minutes` — Time-to-live for pending reservations (default: 15 minutes)
- `job.reservation.check-interval.minutes` — How often to run expiry check (default: 5 minutes)

**Monitoring:**
- Logs: `[ReservationExpiryJob]` info/error messages
- Metrics: Count of expired reservations per run

---

## Future Workers

Candidates for future scheduled tasks:

- **Session Timeout Job** — Auto-resolve sessions marked `AWAITING_PAYMENT` after a configurable period
- **Pass Expiry Job** — Deactivate monthly passes when `validUntil` is reached
- **Report Generation Job** — Batch-generate daily/weekly analytics for managers
- **Payment Reconciliation** — Validate payment status against third-party gateways (VNPay)
- **Disk Cleanup** — Archive old QR code / ticket images

---

## Monitoring & Debugging

### Check Job Status

Enable debug logging in `application.yml`:
```yaml
logging:
  level:
    com.parkmaster.reservation.ReservationExpiryJob: DEBUG
```

### View Recent Runs

Query the `audit_log` table (if implemented) or check Spring Boot actuator metrics:
```bash
curl http://localhost:5000/actuator/metrics/spring.scheduled.tasks.scheduled.duration
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Job not running | `@EnableScheduling` missing | Add to `ParkMasterApplication` main class |
| Job runs but doesn't commit | No `@Transactional` | Ensure service method has `@Transactional` |
| High CPU after job runs | Unbounded query (no LIMIT) | Add pagination/LIMIT clause |

---

## Testing

Run jobs in tests via `@SpringBootTest` with `@EnableScheduling`:

```java
@SpringBootTest
class ReservationExpiryJobTest {
    @Autowired private ReservationExpiryJob job;
    
    @Test
    void testExpireOldReservations() {
        // Create old PENDING reservation
        // Call job.expireReservations()
        // Assert status is EXPIRED
    }
}
```

---

## Performance Notes

- **Scale:** Running on ~15-minute reservations, expiry check every 5 minutes is safe for up to 10K active reservations
- **Database Load:** Use indexed queries on `status` and `createdAt` columns
- **Thread Safety:** Single-threaded scheduler; no concurrent job conflicts

---

## Deployment

- Jobs continue to run in production (dev and deploy branches)
- Seeder runs with `SPRING_PROFILES_ACTIVE=dev` and is separate from scheduled jobs
- Render may pause job execution if app idles; UptimeRobot pings `/api/public/health` every 14min to keep warm
