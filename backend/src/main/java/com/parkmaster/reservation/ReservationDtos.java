package com.parkmaster.reservation;

import com.parkmaster.session.SessionDtos;
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
            Long vehicleTypeId, Long slotId, String slotCode, String floorName, String buildingName,
            Instant holdUntil, Instant createdAt, SessionDtos.AllocationScore allocationScore) {

        static ReservationResponse from(Reservation r) {
            return from(r, null);
        }

        static ReservationResponse from(Reservation r, SessionDtos.AllocationScore score) {
            var slot = r.getSlot();
            var floor = slot.getFloor();
            return new ReservationResponse(r.getId(), r.getStatus(), r.getLicensePlate(),
                    r.getVehicleType().getId(), slot.getId(), slot.getCode(),
                    floor.getName(), floor.getBuilding().getName(),
                    r.getHoldUntil(), r.getCreatedAt(), score);
        }
    }
}
