package com.parkmaster.reservation;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.reservation.ReservationDtos.ReservationResponse;
import com.parkmaster.session.SlotAllocationService;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final Duration HOLD_DURATION = Duration.ofMinutes(30);
    private static final int ALLOCATE_ATTEMPTS = 2;

    private final ReservationRepository reservations;
    private final UserRepository users;
    private final VehicleTypeRepository vehicleTypes;
    private final SlotAllocationService allocation;

    public ReservationService(ReservationRepository reservations, UserRepository users,
            VehicleTypeRepository vehicleTypes, SlotAllocationService allocation) {
        this.reservations = reservations;
        this.users = users;
        this.vehicleTypes = vehicleTypes;
        this.allocation = allocation;
    }

    @Transactional
    public ReservationResponse create(String email, Long buildingId, Long vehicleTypeId,
            String licensePlate) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        VehicleType type = vehicleTypes.findById(vehicleTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));

        ParkingSlot slot = pickAndHoldSlot(buildingId, vehicleTypeId);
        Reservation reservation = new Reservation(user, slot, type, licensePlate,
                Instant.now().plus(HOLD_DURATION));
        return ReservationResponse.from(reservations.save(reservation));
    }

    @Transactional(readOnly = true)
    public java.util.List<ReservationResponse> listForUser(String email) {
        return reservations.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(ReservationResponse::from).toList();
    }

    @Transactional
    public int sweepExpired() {
        java.util.List<Reservation> expired =
                reservations.findByStatusAndHoldUntilBefore(ReservationStatus.PENDING, Instant.now());
        for (Reservation reservation : expired) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservation.getSlot().setStatus(SlotStatus.AVAILABLE);
        }
        return expired.size();
    }

    @Transactional
    public void cancel(String email, Long id) {
        Reservation reservation = reservations.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reservation not found"));
        // Non-owner gets 404, not 403 — do not leak that the reservation exists.
        if (!reservation.getUser().getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Reservation cannot be cancelled");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.getSlot().setStatus(SlotStatus.AVAILABLE);
    }

    // ponytail: re-check + retry-once guards the allocate-then-flip race. Upgrade to a
    // row lock (SELECT ... FOR UPDATE) or @Version only if real contention shows up.
    private ParkingSlot pickAndHoldSlot(Long buildingId, Long vehicleTypeId) {
        for (int attempt = 0; attempt < ALLOCATE_ATTEMPTS; attempt++) {
            ParkingSlot slot = allocation.allocate(buildingId, vehicleTypeId);
            if (slot.getStatus() == SlotStatus.AVAILABLE) {
                slot.setStatus(SlotStatus.RESERVED);
                return slot;
            }
        }
        throw new ApiException(HttpStatus.CONFLICT, "No available slot could be reserved");
    }
}
