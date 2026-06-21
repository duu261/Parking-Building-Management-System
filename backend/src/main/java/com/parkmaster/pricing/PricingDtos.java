package com.parkmaster.pricing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class PricingDtos {

    private PricingDtos() {}

    public record VehicleTypeRequest(
            @NotBlank @Size(max = 60) String name,
            @Size(max = 255) String description) {}

    public record VehicleTypeResponse(Long id, String name, String description) {
        static VehicleTypeResponse from(VehicleType v) {
            return new VehicleTypeResponse(v.getId(), v.getName(), v.getDescription());
        }
    }

    public record PricingPolicyRequest(
            @NotNull @PositiveOrZero BigDecimal ratePerHour,
            @PositiveOrZero BigDecimal dailyCap,
            @PositiveOrZero int graceMinutes,
            @NotNull @DecimalMin("1.0") BigDecimal peakMultiplier,
            @PositiveOrZero BigDecimal monthlyPassPrice) {}

    public record PricingPolicyResponse(Long id, Long vehicleTypeId, String vehicleTypeName,
            BigDecimal ratePerHour, BigDecimal dailyCap, int graceMinutes, BigDecimal peakMultiplier,
            boolean active, BigDecimal monthlyPassPrice) {
        static PricingPolicyResponse from(PricingPolicy p) {
            return new PricingPolicyResponse(p.getId(), p.getVehicleType().getId(),
                    p.getVehicleType().getName(), p.getRatePerHour(), p.getDailyCap(),
                    p.getGraceMinutes(), p.getPeakMultiplier(), p.isActive(),
                    p.getMonthlyPassPrice());
        }
    }
}
