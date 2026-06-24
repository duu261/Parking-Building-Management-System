package com.parkmaster.reservation;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingBuildingRepository;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.payment.Payment;
import com.parkmaster.payment.PaymentMethod;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.payment.VnPayService;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.reservation.ReservationDtos.CreateReservationRequest;
import com.parkmaster.reservation.ReservationDtos.ReservationResponse;
import com.parkmaster.reservation.ReservationDtos.SlotSuggestion;
import com.parkmaster.session.SessionDtos;
import com.parkmaster.session.SlotAllocationService;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final Duration HOLD_GRACE = Duration.ofMinutes(30);
    private static final Duration MAX_ADVANCE = Duration.ofHours(3);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReservationRepository reservations;
    private final UserRepository users;
    private final VehicleTypeRepository vehicleTypes;
    private final SlotAllocationService allocation;
    private final ParkingSlotRepository slots;
    private final ParkingBuildingRepository buildings;
    private final PricingPolicyRepository pricingPolicies;
    private final PaymentRepository payments;
    private final VnPayService vnPay;

    public ReservationService(ReservationRepository reservations, UserRepository users,
            VehicleTypeRepository vehicleTypes, SlotAllocationService allocation,
            ParkingSlotRepository slots, ParkingBuildingRepository buildings,
            PricingPolicyRepository pricingPolicies,
            PaymentRepository payments, VnPayService vnPay) {
        this.reservations = reservations;
        this.users = users;
        this.vehicleTypes = vehicleTypes;
        this.allocation = allocation;
        this.slots = slots;
        this.buildings = buildings;
        this.pricingPolicies = pricingPolicies;
        this.payments = payments;
        this.vnPay = vnPay;
    }

    @Transactional
    public ReservationResponse createFree(String email, CreateReservationRequest req) {
        User user = findUser(email);
        VehicleType type = findVehicleType(req.vehicleTypeId());
        validateReservedStart(req.reservedStart());
        rejectDuplicatePlate(req.licensePlate());

        ParkingBuilding building = buildings.findById(req.buildingId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Building not found"));

        Reservation reservation = new Reservation(user, null, type, req.licensePlate(),
                req.reservedStart().plus(HOLD_GRACE));
        reservation.setReservationType(ReservationType.FREE);
        reservation.setReservedStart(req.reservedStart());
        reservation.setBuilding(building);

        return ReservationResponse.from(reservations.save(reservation), null);
    }

    @Transactional
    public PaidReservationResult createPaid(String email, CreateReservationRequest req,
            String clientIp) {
        User user = findUser(email);
        VehicleType type = findVehicleType(req.vehicleTypeId());
        validateReservedStart(req.reservedStart());
        rejectDuplicatePlate(req.licensePlate());

        if (req.slotId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "slotId is required for paid reservation");
        }

        ParkingSlot slot = slots.findById(req.slotId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Slot not found"));
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "Slot is not available");
        }
        if (!slot.getFloor().getBuilding().getId().equals(req.buildingId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Slot does not belong to selected building");
        }

        slot.setStatus(SlotStatus.RESERVED);

        PricingPolicy pricing = pricingPolicies.findByVehicleTypeId(type.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pricing not found"));
        BigDecimal deposit = pricing.getRatePerHour();

        Payment payment = new Payment(deposit);
        payment.setMethod(PaymentMethod.VNPAY);
        payment.setDescription("Reservation deposit · " + req.licensePlate()
                + " · " + slot.getCode());
        payment = payments.save(payment);

        // ponytail: short hold until payment confirmed; VNPay callback extends to reservedStart + grace
        Reservation reservation = new Reservation(user, slot, type, req.licensePlate(),
                Instant.now().plus(Duration.ofMinutes(15)));
        reservation.setReservationType(ReservationType.PAID);
        reservation.setReservedStart(req.reservedStart());
        reservation.setBuilding(slot.getFloor().getBuilding());
        reservation.setDepositAmount(deposit);
        reservation.setDepositPayment(payment);

        var ranked = allocation.rank(req.buildingId(), req.vehicleTypeId());
        if (!ranked.isEmpty()) {
            var winner = ranked.stream()
                    .filter(r -> r.slot().getId().equals(req.slotId()))
                    .findFirst().orElse(ranked.get(0));
            var score = new SessionDtos.AllocationScore(
                    round(winner.vehicleTypeMatch()), round(winner.loadBalance()),
                    round(winner.distanceToEntry()), round(winner.peakHour()),
                    round(winner.total()), ranked.size());
            try {
                reservation.setAllocationScore(
                        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(score));
            } catch (Exception ignored) {}
        }

        reservation = reservations.save(reservation);

        String txnRef = payment.getId() + "_" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(ZonedDateTime.now(VN_ZONE));
        payment.setGatewayRef(txnRef);
        payments.save(payment);

        String vnpayUrl = vnPay.buildPaymentUrl(txnRef, deposit.longValue(),
                "Parking reservation deposit #" + reservation.getId(), clientIp);

        return new PaidReservationResult(
                ReservationResponse.from(reservation), vnpayUrl, deposit);
    }

    public record PaidReservationResult(ReservationResponse reservation, String vnpayUrl,
            BigDecimal depositAmount) {}

    @Transactional(readOnly = true)
    public List<ReservationResponse> listForUser(String email) {
        return reservations.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(ReservationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SlotSuggestion> suggestSlots(Long buildingId, Long vehicleTypeId) {
        var ranked = allocation.rank(buildingId, vehicleTypeId);
        int total = ranked.size();
        return ranked.stream().map(r -> {
            var s = r.slot();
            return new SlotSuggestion(s.getId(), s.getCode(),
                    s.getFloor().getName(), s.getFloor().getLevel(),
                    round(r.total()), ranked.indexOf(r) == 0,
                    round(r.vehicleTypeMatch()), round(r.loadBalance()),
                    round(r.distanceToEntry()), round(r.peakHour()), total);
        }).toList();
    }

    @Transactional
    public Reservation consumeForCheckIn(Long reservationId) {
        Reservation reservation = reservations.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Reservation is not active");
        }
        if (reservation.getHoldUntil().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.CONFLICT, "Reservation has expired");
        }
        if (reservation.getReservationType() == ReservationType.PAID
                && (reservation.getDepositPayment() == null
                    || reservation.getDepositPayment().getStatus() != com.parkmaster.payment.PaymentStatus.PAID)) {
            throw new ApiException(HttpStatus.CONFLICT, "Deposit has not been paid yet");
        }
        reservation.setStatus(ReservationStatus.FULFILLED);
        return reservation;
    }

    @Transactional
    public int sweepExpired() {
        List<Reservation> expired =
                reservations.findByStatusAndHoldUntilBefore(ReservationStatus.PENDING, Instant.now());
        for (Reservation reservation : expired) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            if (reservation.getSlot() != null) {
                reservation.getSlot().setStatus(SlotStatus.AVAILABLE);
            }
        }
        return expired.size();
    }

    @Transactional
    public void cancel(String email, Long id) {
        Reservation reservation = reservations.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!reservation.getUser().getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Reservation cannot be cancelled");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        if (reservation.getSlot() != null) {
            reservation.getSlot().setStatus(SlotStatus.AVAILABLE);
        }
    }

    private void validateReservedStart(Instant reservedStart) {
        Instant now = Instant.now();
        if (reservedStart.isBefore(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Arrival time must be in the future");
        }
        if (reservedStart.isAfter(now.plus(MAX_ADVANCE))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cannot reserve more than 3 hours ahead");
        }
    }

    private void rejectDuplicatePlate(String plate) {
        if (reservations.existsByLicensePlateAndStatus(plate, ReservationStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "A pending reservation already exists for this plate");
        }
    }

    private User findUser(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private VehicleType findVehicleType(Long id) {
        return vehicleTypes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
