package com.parkmaster.payment;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record SettleRequest(@NotNull PaymentMethod method) {}

    public record PaymentResponse(Long id, Long sessionId, BigDecimal amount, PaymentMethod method,
            PaymentStatus status, Instant createdAt, Instant paidAt) {
        static PaymentResponse from(Payment p) {
            return new PaymentResponse(p.getId(), p.getSession().getId(), p.getAmount(),
                    p.getMethod(), p.getStatus(), p.getCreatedAt(), p.getPaidAt());
        }
    }

    public record RevenueResponse(Instant from, Instant to, BigDecimal totalPaid, long count) {}
}
