package com.parkmaster.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkmaster.common.ApiException;
import com.parkmaster.common.PeakHours;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.payment.Payment;
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
            rejectIfAlreadyParked(reservation.getLicensePlate());

            ParkingSlot slot;
            String allocationScoreJson = reservation.getAllocationScore();

            if (reservation.getSlot() == null) {
                // FREE reservation: AI allocates at check-in
                var ranked = allocation.rank(
                        reservation.getBuilding().getId(),
                        reservation.getVehicleType().getId());
                if (ranked.isEmpty()) {
                    throw new ApiException(HttpStatus.CONFLICT, "No available slots in building");
                }
                var winner = ranked.get(0);
                slot = winner.slot();
                var score = new SessionDtos.AllocationScore(
                        round(winner.vehicleTypeMatch()), round(winner.loadBalance()),
                        round(winner.distanceToEntry()), round(winner.peakHour()),
                        round(winner.total()), ranked.size());
                try {
                    allocationScoreJson = new ObjectMapper().writeValueAsString(score);
                } catch (Exception ignored) {}
            } else {
                // PAID reservation: slot already reserved
                slot = reservation.getSlot();
            }

            ParkingSession session = new ParkingSession(slot, reservation.getVehicleType(),
                    reservation.getLicensePlate(), true);
            session.setUser(reservation.getUser());
            session.setAllocationScore(allocationScoreJson);
            session.setFromReservation(true);
            if (reservation.getDepositAmount() != null) {
                session.setDepositCredit(reservation.getDepositAmount());
            }
            slot.setStatus(SlotStatus.OCCUPIED);
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

        rejectIfAlreadyParked(req.licensePlate());

        boolean autoAllocated = req.slotId() == null;
        ParkingSlot slot;
        String allocationScoreJson = null;
        if (autoAllocated) {
            var ranked = allocation.rank(req.buildingId(), req.vehicleTypeId());
            if (ranked.isEmpty()) {
                throw new ApiException(HttpStatus.CONFLICT, "No available slots in building");
            }
            var winner = ranked.get(0);
            slot = winner.slot();
            // Build AllocationScore from the winner's breakdown
            var scoreRecord = new SessionDtos.AllocationScore(
                round(winner.vehicleTypeMatch()),
                round(winner.loadBalance()),
                round(winner.distanceToEntry()),
                round(winner.peakHour()),
                round(winner.total()),
                ranked.size()
            );
            try {
                var mapper = new ObjectMapper();
                allocationScoreJson = mapper.writeValueAsString(scoreRecord);
            } catch (Exception e) {
                // Ignore serialization errors; score remains null
            }
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
        session.setAllocationScore(allocationScoreJson);
        monthlyPasses.findUserByPlate(req.licensePlate()).ifPresent(session::setUser);
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
        BigDecimal amount = computeCharge(session, policy, checkOut);
        session.setAmountCharged(amount);
        Payment payment = payments.createForSession(session, amount);
        if (amount.signum() == 0) {
            session.setStatus(SessionStatus.COMPLETED);
            session.getSlot().setStatus(SlotStatus.AVAILABLE);
        } else {
            session.setStatus(SessionStatus.AWAITING_PAYMENT);
        }
        return SessionResponse.from(session, payment.getId());
    }

    @Transactional(readOnly = true)
    public BigDecimal estimateCharge(Long sessionId) {
        ParkingSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (session.getStatus() != SessionStatus.ACTIVE) {
            return session.getAmountCharged() != null ? session.getAmountCharged() : BigDecimal.ZERO;
        }
        PricingPolicy policy = policies.findByVehicleTypeId(session.getVehicleType().getId())
                .orElse(null);
        if (policy == null) return BigDecimal.ZERO;
        return computeCharge(session, policy, Instant.now());
    }

    private BigDecimal computeCharge(ParkingSession session, PricingPolicy policy, Instant checkOut) {
        if (monthlyPasses.hasActivePass(session.getLicensePlate(),
                session.getVehicleType().getId(), LocalDate.now(PeakHours.VN_ZONE))) {
            return BigDecimal.ZERO;
        }
        BigDecimal multiplier = PeakHours.isPeak(session.getCheckInAt())
                ? policy.getPeakMultiplier() : BigDecimal.ONE;
        BigDecimal amount = ChargeCalculator.charge(session.getCheckInAt(), checkOut,
                policy.getRatePerHour(), policy.getDailyCap(), policy.getGraceMinutes(), multiplier);
        if (session.isFromReservation() && session.getDepositCredit() != null) {
            amount = amount.subtract(session.getDepositCredit()).max(BigDecimal.ZERO);
        } else if (session.isFromReservation() && session.getDepositCredit() == null) {
            amount = amount.multiply(new BigDecimal("0.9"))
                    .setScale(0, java.math.RoundingMode.CEILING);
        }
        return amount;
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
        ParkingSession s = sessions.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        Long paymentId = payments.paymentIdForSession(s.getId()).orElse(null);
        return SessionResponse.from(s, paymentId);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> byPlate(String plate) {
        return sessions.findByLicensePlateIgnoreCaseAndStatusIn(plate,
                List.of(SessionStatus.ACTIVE, SessionStatus.AWAITING_PAYMENT))
                .stream().map(s -> {
                    Long pid = payments.paymentIdForSession(s.getId()).orElse(null);
                    return SessionResponse.from(s, pid);
                }).toList();
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

    private void rejectIfAlreadyParked(String plate) {
        if (plate == null || plate.isBlank()) return;
        boolean exists = !sessions.findByLicensePlateIgnoreCaseAndStatusIn(
                plate, List.of(SessionStatus.ACTIVE, SessionStatus.AWAITING_PAYMENT)).isEmpty();
        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Vehicle " + plate + " already has an active session");
        }
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
