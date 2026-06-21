package com.parkmaster.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class SessionDtos {

    private SessionDtos() {}

    public record AllocationScore(double vehicleTypeMatch, double loadBalance,
            double distanceToEntry, double peakHour, double total, int alternativesConsidered) {}

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

    public record SessionResponse(Long id, Long slotId, String slotCode, String floorName,
            String buildingName, Long vehicleTypeId, String licensePlate,
            String ticketCode, Instant checkInAt, Instant checkOutAt, BigDecimal amountCharged,
            SessionStatus status, boolean autoAllocated, AllocationScore allocationScore) {
        static SessionResponse from(ParkingSession s) {
            var slot = s.getSlot();
            var floor = slot.getFloor();
            AllocationScore score = null;
            if (s.getAllocationScore() != null) {
                try {
                    var mapper = new ObjectMapper();
                    var node = mapper.readTree(s.getAllocationScore());
                    score = new AllocationScore(
                        node.get("vehicleTypeMatch").asDouble(),
                        node.get("loadBalance").asDouble(),
                        node.get("distanceToEntry").asDouble(),
                        node.get("peakHour").asDouble(),
                        node.get("total").asDouble(),
                        node.get("alternativesConsidered").asInt()
                    );
                } catch (Exception e) {
                    // Ignore parse errors; score remains null
                }
            }
            return new SessionResponse(s.getId(), slot.getId(), slot.getCode(),
                    floor.getName(), floor.getBuilding().getName(),
                    s.getVehicleType().getId(),
                    s.getLicensePlate(), s.getTicketCode(), s.getCheckInAt(), s.getCheckOutAt(),
                    s.getAmountCharged(), s.getStatus(), s.isAutoAllocated(), score);
        }
    }
}
