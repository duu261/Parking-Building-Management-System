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
            Instant paidAt, Instant voidedAt, String voidReason, String processedByStaff,
            String licensePlate, String vehicleType, String slotCode, String buildingName) {
        static PaymentResponse from(Payment p) {
            var s = p.getSession();
            return new PaymentResponse(p.getId(),
                    s != null ? s.getId() : null,
                    p.getAmount(), p.getPenaltyAmount(), p.getMethod(), p.getStatus(),
                    p.getCreatedAt(), p.getPaidAt(), p.getVoidedAt(), p.getVoidReason(),
                    p.getProcessedByStaff() == null ? null : p.getProcessedByStaff().getFullName(),
                    s != null ? s.getLicensePlate() : null,
                    s != null && s.getVehicleType() != null ? s.getVehicleType().getName() : null,
                    s != null && s.getSlot() != null ? s.getSlot().getCode() : null,
                    s != null && s.getSlot() != null && s.getSlot().getFloor() != null
                            ? s.getSlot().getFloor().getBuilding().getName() : null);
        }
    }

    public record RevenueResponse(Instant from, Instant to, BigDecimal totalPaid, long count) {}

    /** VNPay checkout URL the driver is redirected to. */
    public record VnPayStartResponse(String paymentUrl) {}
}
