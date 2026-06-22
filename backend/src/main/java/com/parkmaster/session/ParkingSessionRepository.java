package com.parkmaster.session;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    List<ParkingSession> findByStatusOrderByCheckInAt(SessionStatus status);

    Optional<ParkingSession> findByTicketCode(String ticketCode);

    List<ParkingSession> findByLicensePlateIgnoreCaseAndStatus(String licensePlate, SessionStatus status);

    List<ParkingSession> findByLicensePlateIgnoreCaseAndStatusIn(String licensePlate, List<SessionStatus> statuses);

    List<ParkingSession> findByUser_EmailOrderByCheckInAtDesc(String email);

    boolean existsBySlotIdAndStatus(Long slotId, SessionStatus status);

    // For report aggregation: sessions started in a window, grouped in-service.
    List<ParkingSession> findByCheckInAtGreaterThanEqualAndCheckInAtLessThan(
            Instant from, Instant to);
}
