package com.parkmaster.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findBySessionId(Long sessionId);

    List<Payment> findByStatusOrderByCreatedAt(PaymentStatus status);

    List<Payment> findBySession_User_EmailOrderByCreatedAtDesc(String email);

    // For report aggregation: paid payments in a window, grouped in-service.
    List<Payment> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
            PaymentStatus status, Instant from, Instant to);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p "
            + "WHERE p.status = com.parkmaster.payment.PaymentStatus.PAID "
            + "AND p.paidAt >= :from AND p.paidAt < :to")
    BigDecimal sumPaidBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(p) FROM Payment p "
            + "WHERE p.status = com.parkmaster.payment.PaymentStatus.PAID "
            + "AND p.paidAt >= :from AND p.paidAt < :to")
    long countPaidBetween(@Param("from") Instant from, @Param("to") Instant to);
}
