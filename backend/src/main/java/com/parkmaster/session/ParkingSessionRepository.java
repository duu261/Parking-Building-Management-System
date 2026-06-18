package com.parkmaster.session;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    List<ParkingSession> findByStatusOrderByCheckInAt(SessionStatus status);

    List<ParkingSession> findByUser_EmailOrderByCheckInAtDesc(String email);

    boolean existsBySlotIdAndStatus(Long slotId, SessionStatus status);
}
