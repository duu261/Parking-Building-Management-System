package com.parkmaster.session;

import com.parkmaster.common.ApiException;
import com.parkmaster.common.PeakHours;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.session.SessionDtos.CheckInRequest;
import com.parkmaster.session.SessionDtos.SessionResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParkingSessionService {

    private final ParkingSessionRepository sessions;
    private final ParkingSlotRepository slots;
    private final VehicleTypeRepository vehicleTypes;
    private final PricingPolicyRepository policies;
    private final SlotAllocationService allocation;

    public ParkingSessionService(ParkingSessionRepository sessions, ParkingSlotRepository slots,
            VehicleTypeRepository vehicleTypes, PricingPolicyRepository policies,
            SlotAllocationService allocation) {
        this.sessions = sessions;
        this.slots = slots;
        this.vehicleTypes = vehicleTypes;
        this.policies = policies;
        this.allocation = allocation;
    }

    @Transactional
    public SessionResponse checkIn(CheckInRequest req) {
        if (req.slotId() == null && req.buildingId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Either slotId or buildingId must be provided");
        }

        boolean autoAllocated = req.slotId() == null;
        ParkingSlot slot;
        if (autoAllocated) {
            slot = allocation.allocate(req.buildingId(), req.vehicleTypeId());
        } else {
            slot = slots.findById(req.slotId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Slot not found"));
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new ApiException(HttpStatus.CONFLICT, "Slot is not available");
            }
        }

        VehicleType type = vehicleTypes.findById(req.vehicleTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));

        ParkingSession session = new ParkingSession(slot, type, req.licensePlate(), autoAllocated);
        slot.setStatus(SlotStatus.OCCUPIED);
        return SessionResponse.from(sessions.save(session));
    }

    @Transactional
    public SessionResponse checkOut(Long sessionId) {
        ParkingSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "Session is already closed");
        }
        PricingPolicy policy = policies.findByVehicleTypeId(session.getVehicleType().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                        "No pricing policy for this vehicle type"));

        Instant checkOut = Instant.now();
        session.setCheckOutAt(checkOut);
        BigDecimal multiplier = PeakHours.isPeak(session.getCheckInAt())
                ? policy.getPeakMultiplier() : BigDecimal.ONE;
        session.setAmountCharged(ChargeCalculator.charge(session.getCheckInAt(), checkOut,
                policy.getRatePerHour(), policy.getDailyCap(), policy.getGraceMinutes(), multiplier));
        session.setStatus(SessionStatus.COMPLETED);
        session.getSlot().setStatus(SlotStatus.AVAILABLE);
        return SessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listActive() {
        return sessions.findByStatusOrderByCheckInAt(SessionStatus.ACTIVE).stream()
                .map(SessionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse get(Long id) {
        return SessionResponse.from(sessions.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found")));
    }
}
