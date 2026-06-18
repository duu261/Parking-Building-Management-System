package com.parkmaster.reservation;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// ponytail: in-process @Scheduled. Fine for a single instance. Move to a DB-backed
// job (ShedLock / Quartz) only if the app runs multi-instance.
@Component
class ReservationExpiryJob {

    private static final long SWEEP_INTERVAL_MS = 60_000L;

    private final ReservationService service;

    ReservationExpiryJob(ReservationService service) {
        this.service = service;
    }

    @Scheduled(fixedDelay = SWEEP_INTERVAL_MS)
    void releaseExpired() {
        service.sweepExpired();
    }
}
