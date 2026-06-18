package com.parkmaster.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ReservationDtos {

    private ReservationDtos() {}

    public record CreateReservationRequest(
            @NotNull Long buildingId,
            @NotNull Long vehicleTypeId,
            @NotBlank @Size(max = 20) String licensePlate) {}

    public record ReservationResponse(Long id, ReservationStatus status, String licensePlate,
            Long vehicleTypeId, Long slotId, String slotCode, Instant holdUntil, Instant createdAt) {

        static ReservationResponse from(Reservation r) {
            return new ReservationResponse(r.getId(), r.getStatus(), r.getLicensePlate(),
                    r.getVehicleType().getId(), r.getSlot().getId(), r.getSlot().getCode(),
                    r.getHoldUntil(), r.getCreatedAt());
        }
    }
}
