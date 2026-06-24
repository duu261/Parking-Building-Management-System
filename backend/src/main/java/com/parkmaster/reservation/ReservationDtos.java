package com.parkmaster.reservation;

import com.parkmaster.payment.PaymentStatus;
import com.parkmaster.session.SessionDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class ReservationDtos {

    private ReservationDtos() {}

    public record CreateReservationRequest(
            @NotNull Long buildingId,
            @NotNull Long vehicleTypeId,
            @NotBlank @Size(max = 20) String licensePlate,
            @NotNull Instant reservedStart,
            @NotNull ReservationType reservationType,
            Long slotId) {}

    public record ReservationResponse(Long id, ReservationStatus status, String licensePlate,
            Long vehicleTypeId, Long slotId, String slotCode, String floorName, String buildingName,
            Instant holdUntil, Instant createdAt, Instant reservedStart,
            ReservationType reservationType, BigDecimal depositAmount, boolean depositPaid,
            SessionDtos.AllocationScore allocationScore) {

        static ReservationResponse from(Reservation r) {
            return from(r, SessionDtos.AllocationScore.parse(r.getAllocationScore()));
        }

        static ReservationResponse from(Reservation r, SessionDtos.AllocationScore score) {
            var slot = r.getSlot();
            String buildingName = slot != null
                    ? slot.getFloor().getBuilding().getName()
                    : (r.getBuilding() != null ? r.getBuilding().getName() : null);
            boolean paid = r.getDepositPayment() != null
                    && r.getDepositPayment().getStatus() == PaymentStatus.PAID;
            return new ReservationResponse(r.getId(), r.getStatus(), r.getLicensePlate(),
                    r.getVehicleType().getId(),
                    slot != null ? slot.getId() : null,
                    slot != null ? slot.getCode() : null,
                    slot != null ? slot.getFloor().getName() : null,
                    buildingName,
                    r.getHoldUntil(), r.getCreatedAt(), r.getReservedStart(),
                    r.getReservationType(), r.getDepositAmount(), paid, score);
        }
    }

    public record SlotSuggestion(Long slotId, String slotCode, String floorName,
            int floorLevel, double score, boolean aiRecommended,
            double vehicleTypeMatch, double loadBalance,
            double distanceToEntry, double peakHour, int alternativesConsidered) {}
}
