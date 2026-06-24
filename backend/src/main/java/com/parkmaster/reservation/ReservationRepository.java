package com.parkmaster.reservation;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUser_EmailOrderByCreatedAtDesc(String email);

    List<Reservation> findByStatusAndHoldUntilBefore(ReservationStatus status, Instant time);

    boolean existsByLicensePlateAndStatus(String licensePlate, ReservationStatus status);

    java.util.Optional<Reservation> findByDepositPaymentId(Long paymentId);
}
