package com.parkmaster.session;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class SessionDtos {

    private SessionDtos() {}

    /**
     * slotId: manual pick. buildingId: auto-allocate. reservationId: consume a hold.
     * Exactly one entry path is used; the service validates the combination.
     */
    public record CheckInRequest(
            Long slotId,
            Long buildingId,
            Long vehicleTypeId,
            @Size(max = 20) String licensePlate,
            Long reservationId) {}

    public record SessionResponse(Long id, Long slotId, Long vehicleTypeId, String licensePlate,
            String ticketCode, Instant checkInAt, Instant checkOutAt, BigDecimal amountCharged,
            SessionStatus status, boolean autoAllocated) {
        static SessionResponse from(ParkingSession s) {
            return new SessionResponse(s.getId(), s.getSlot().getId(), s.getVehicleType().getId(),
                    s.getLicensePlate(), s.getTicketCode(), s.getCheckInAt(), s.getCheckOutAt(),
                    s.getAmountCharged(), s.getStatus(), s.isAutoAllocated());
        }
    }
}
