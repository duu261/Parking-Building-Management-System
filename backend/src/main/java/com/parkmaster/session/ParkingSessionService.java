package com.parkmaster.session;

import com.parkmaster.common.ApiException;
import com.parkmaster.common.PeakHours;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.payment.PaymentService;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.session.SessionDtos.CheckInRequest;
import com.parkmaster.session.SessionDtos.SessionResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
    private final PaymentService payments;
    private final com.parkmaster.reservation.ReservationService reservationService;
    private final com.parkmaster.pass.MonthlyPassService monthlyPasses;

    public ParkingSessionService(ParkingSessionRepository sessions, ParkingSlotRepository slots,
            VehicleTypeRepository vehicleTypes, PricingPolicyRepository policies,
            SlotAllocationService allocation, PaymentService payments,
            com.parkmaster.reservation.ReservationService reservationService,
            com.parkmaster.pass.MonthlyPassService monthlyPasses) {
        this.sessions = sessions;
        this.slots = slots;
        this.vehicleTypes = vehicleTypes;
        this.policies = policies;
        this.allocation = allocation;
        this.payments = payments;
        this.reservationService = reservationService;
        this.monthlyPasses = monthlyPasses;
    }

    @Transactional
    public SessionResponse checkIn(CheckInRequest req) {
        if (req.reservationId() != null) {
            com.parkmaster.reservation.Reservation reservation =
                    reservationService.consumeForCheckIn(req.reservationId());
            ParkingSlot reservedSlot = reservation.getSlot();
            ParkingSession session = new ParkingSession(reservedSlot, reservation.getVehicleType(),
                    reservation.getLicensePlate(), false);
            session.setUser(reservation.getUser());
            reservedSlot.setStatus(SlotStatus.OCCUPIED);
            return SessionResponse.from(sessions.save(session));
        }

        if (req.vehicleTypeId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "vehicleTypeId is required");
        }
        if (req.licensePlate() == null || req.licensePlate().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "licensePlate is required");
        }
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
        // An active monthly pass for this plate+type parks free; otherwise bill normally.
        // "Today" uses the app calendar zone so a pass does not expire on UTC midnight.
        BigDecimal amount;
        if (monthlyPasses.hasActivePass(session.getLicensePlate(),
                session.getVehicleType().getId(), LocalDate.now(PeakHours.VN_ZONE))) {
            amount = BigDecimal.ZERO;
        } else {
            // Peak surcharge keyed to check-in time (encourages off-peak entry), not check-out.
            BigDecimal multiplier = PeakHours.isPeak(session.getCheckInAt())
                    ? policy.getPeakMultiplier() : BigDecimal.ONE;
            amount = ChargeCalculator.charge(session.getCheckInAt(), checkOut,
                    policy.getRatePerHour(), policy.getDailyCap(), policy.getGraceMinutes(), multiplier);
        }
        session.setAmountCharged(amount);
        payments.createForSession(session, amount);
        if (amount.signum() == 0) {
            // Free exit: nothing to settle, so complete and release the slot now.
            session.setStatus(SessionStatus.COMPLETED);
            session.getSlot().setStatus(SlotStatus.AVAILABLE);
        } else {
            // Slot stays OCCUPIED until the payment is settled (or voided); the
            // payment side completes the session and frees the slot then.
            session.setStatus(SessionStatus.AWAITING_PAYMENT);
        }
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

    @Transactional(readOnly = true)
    public List<SessionResponse> listForUser(String email) {
        return sessions.findByUser_EmailOrderByCheckInAtDesc(email).stream()
                .map(SessionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse getForUser(String email, Long id) {
        ParkingSession session = sessions.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        // Non-owner gets 404, not 403 — do not leak that the session exists.
        if (session.getUser() == null || !session.getUser().getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");
        }
        return SessionResponse.from(session);
    }

    /** Staff scans a ticket QR; resolve the code to its session for check-out. */
    @Transactional(readOnly = true)
    public SessionResponse byTicket(String ticketCode) {
        return SessionResponse.from(sessions.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found")));
    }

    /** PNG QR encoding the session's ticket code. Staff prints it for walk-ins. */
    @Transactional(readOnly = true)
    public byte[] ticketQr(Long id) {
        ParkingSession session = sessions.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        return QrCodeGenerator.pngFor(session.getTicketCode());
    }

    /** Same QR, but a driver may only fetch their own ticket. */
    @Transactional(readOnly = true)
    public byte[] ticketQrForUser(String email, Long id) {
        ParkingSession session = sessions.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (session.getUser() == null || !session.getUser().getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");
        }
        return QrCodeGenerator.pngFor(session.getTicketCode());
    }
}
