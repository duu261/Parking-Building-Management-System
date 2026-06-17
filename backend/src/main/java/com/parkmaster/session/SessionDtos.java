package com.parkmaster.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class SessionDtos {

    private SessionDtos() {}

    /**
     * slotId: manual pick. buildingId: auto-allocate. Exactly one must be non-null.
     */
    public record CheckInRequest(
            Long slotId,
            Long buildingId,
            @NotNull Long vehicleTypeId,
            @NotBlank @Size(max = 20) String licensePlate) {}

    public record SessionResponse(Long id, Long slotId, Long vehicleTypeId, String licensePlate,
            Instant checkInAt, Instant checkOutAt, BigDecimal amountCharged, SessionStatus status,
            boolean autoAllocated) {
        static SessionResponse from(ParkingSession s) {
            return new SessionResponse(s.getId(), s.getSlot().getId(), s.getVehicleType().getId(),
                    s.getLicensePlate(), s.getCheckInAt(), s.getCheckOutAt(), s.getAmountCharged(),
                    s.getStatus(), s.isAutoAllocated());
        }
    }
}
