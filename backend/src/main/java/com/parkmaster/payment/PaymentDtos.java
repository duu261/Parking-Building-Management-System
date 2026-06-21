package com.parkmaster.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record SettleRequest(@NotNull PaymentMethod method) {}

    public record VoidRequest(@NotBlank String reason) {}

    public record PaymentResponse(Long id, Long sessionId, BigDecimal amount,
            BigDecimal penaltyAmount, PaymentMethod method, PaymentStatus status, Instant createdAt,
            Instant paidAt, Instant voidedAt, String voidReason, String processedByStaff) {
        static PaymentResponse from(Payment p) {
            return new PaymentResponse(p.getId(),
                    p.getSession() != null ? p.getSession().getId() : null,
                    p.getAmount(), p.getPenaltyAmount(), p.getMethod(), p.getStatus(),
                    p.getCreatedAt(), p.getPaidAt(), p.getVoidedAt(), p.getVoidReason(),
                    p.getProcessedByStaff() == null ? null : p.getProcessedByStaff().getFullName());
        }
    }

    public record RevenueResponse(Instant from, Instant to, BigDecimal totalPaid, long count) {}

    /** VNPay checkout URL the driver is redirected to. */
    public record VnPayStartResponse(String paymentUrl) {}
}
