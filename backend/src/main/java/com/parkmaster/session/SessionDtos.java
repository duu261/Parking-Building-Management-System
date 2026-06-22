package com.parkmaster.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class SessionDtos {

    private SessionDtos() {}

    public record AllocationScore(double vehicleTypeMatch, double loadBalance,
            double distanceToEntry, double peakHour, double total, int alternativesConsidered) {
        public static AllocationScore parse(String json) {
            if (json == null) return null;
            try {
                var node = new ObjectMapper().readTree(json);
                return new AllocationScore(
                        node.get("vehicleTypeMatch").asDouble(),
                        node.get("loadBalance").asDouble(),
                        node.get("distanceToEntry").asDouble(),
                        node.get("peakHour").asDouble(),
                        node.get("total").asDouble(),
                        node.get("alternativesConsidered").asInt());
            } catch (Exception e) { return null; }
        }
    }

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
            String buildingName, Long vehicleTypeId, String vehicleTypeName, String licensePlate,
            String ticketCode, Instant checkInAt, Instant checkOutAt, BigDecimal amountCharged,
            SessionStatus status, boolean autoAllocated, AllocationScore allocationScore,
            Long userId, String userFullName, String userEmail) {
        static SessionResponse from(ParkingSession s) {
            var slot = s.getSlot();
            var floor = slot.getFloor();
            var user = s.getUser();
            AllocationScore score = AllocationScore.parse(s.getAllocationScore());
            return new SessionResponse(s.getId(), slot.getId(), slot.getCode(),
                    floor.getName(), floor.getBuilding().getName(),
                    s.getVehicleType().getId(), s.getVehicleType().getName(),
                    s.getLicensePlate(), s.getTicketCode(), s.getCheckInAt(), s.getCheckOutAt(),
                    s.getAmountCharged(), s.getStatus(), s.isAutoAllocated(), score,
                    user != null ? user.getId() : null,
                    user != null ? user.getFullName() : null,
                    user != null ? user.getEmail() : null);
        }
    }
}
