package com.parkmaster.pass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class PassDtos {

    private PassDtos() {}

    public record IssueRequest(
            @NotBlank String email,
            @NotNull Long vehicleTypeId,
            @NotBlank String licensePlate,
            @NotNull LocalDate validFrom,
            @NotNull LocalDate validUntil) {}

    public record PassResponse(Long id, Long userId, String userFullName, Long vehicleTypeId,
            String vehicleTypeName, String licensePlate, LocalDate validFrom, LocalDate validUntil,
            String status, Instant createdAt, Long paymentId, BigDecimal price) {

        public static PassResponse from(MonthlyPass p) {
            return new PassResponse(p.getId(), p.getUser().getId(), p.getUser().getFullName(),
                    p.getVehicleType().getId(), p.getVehicleType().getName(), p.getLicensePlate(),
                    p.getValidFrom(), p.getValidUntil(), p.getStatus().name(), p.getCreatedAt(),
                    p.getPayment() != null ? p.getPayment().getId() : null,
                    p.getPayment() != null ? p.getPayment().getAmount() : null);
        }
    }
}
