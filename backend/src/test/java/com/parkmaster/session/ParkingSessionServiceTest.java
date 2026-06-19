package com.parkmaster.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.payment.PaymentService;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.session.SessionDtos.CheckInRequest;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for ParkingSessionService — repositories mocked, no Spring context. */
class ParkingSessionServiceTest {

    private ParkingSessionRepository sessions;
    private ParkingSlotRepository slots;
    private VehicleTypeRepository vehicleTypes;
    private PricingPolicyRepository policies;
    private SlotAllocationService allocation;
    private PaymentService payments;
    private com.parkmaster.reservation.ReservationService reservationService;
    private com.parkmaster.pass.MonthlyPassService monthlyPasses;
    private ParkingSessionService service;

    @BeforeEach
    void setUp() {
        sessions = Mockito.mock(ParkingSessionRepository.class);
        slots = Mockito.mock(ParkingSlotRepository.class);
        vehicleTypes = Mockito.mock(VehicleTypeRepository.class);
        policies = Mockito.mock(PricingPolicyRepository.class);
        allocation = Mockito.mock(SlotAllocationService.class);
        payments = Mockito.mock(PaymentService.class);
        reservationService = Mockito.mock(com.parkmaster.reservation.ReservationService.class);
        monthlyPasses = Mockito.mock(com.parkmaster.pass.MonthlyPassService.class);
        service = new ParkingSessionService(sessions, slots, vehicleTypes, policies, allocation,
                payments, reservationService, monthlyPasses);
    }

    private ParkingSlot slot(SlotStatus status) {
        ParkingSlot s = new ParkingSlot(new Floor(new ParkingBuilding("B", null), 1, "P1"), "A1");
        s.setStatus(status);
        return s;
    }

    @Test
    void checkOutWithActivePassIsFree() {
        VehicleType car = new VehicleType("Car", null);
        ParkingSlot slot = slot(SlotStatus.OCCUPIED);
        ParkingSession session = new ParkingSession(slot, car, "51A-123", false);
        session.setCheckInAt(java.time.Instant.now().minusSeconds(5 * 3600));
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(policies.findByVehicleTypeId(any()))
                .thenReturn(Optional.of(new PricingPolicy(car, new BigDecimal("3.00"), null, 0)));
        when(monthlyPasses.hasActivePass(any(), any(), any())).thenReturn(true);

        var resp = service.checkOut(1L);

        assertThat(resp.amountCharged()).isEqualByComparingTo("0.00");
        assertThat(resp.status()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        verify(payments).createForSession(session, session.getAmountCharged());
    }

    @Test
    void checkInRejectsUnavailableSlot() {
        when(slots.findById(1L)).thenReturn(Optional.of(slot(SlotStatus.OCCUPIED)));
        assertThatThrownBy(() -> service.checkIn(new CheckInRequest(1L, null, 2L, "51A-123", null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void checkInRejectsWhenNeitherSlotNorBuilding() {
        assertThatThrownBy(() -> service.checkIn(new CheckInRequest(null, null, 2L, "51A-123", null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void checkInOccupiesSlotAndSaves() {
        ParkingSlot slot = slot(SlotStatus.AVAILABLE);
        when(slots.findById(1L)).thenReturn(Optional.of(slot));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(new VehicleType("Car", null)));
        when(sessions.save(any(ParkingSession.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.checkIn(new CheckInRequest(1L, null, 2L, "51A-123", null));
        assertThat(resp.licensePlate()).isEqualTo("51A-123");
        assertThat(resp.status()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(resp.autoAllocated()).isFalse();
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.OCCUPIED);
    }

    @Test
    void checkInAutoAllocatesWhenNoSlotId() {
        ParkingSlot slot = slot(SlotStatus.AVAILABLE);
        when(allocation.allocate(10L, 2L)).thenReturn(slot);
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(new VehicleType("Car", null)));
        when(sessions.save(any(ParkingSession.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.checkIn(new CheckInRequest(null, 10L, 2L, "51A-123", null));
        assertThat(resp.autoAllocated()).isTrue();
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.OCCUPIED);
    }

    @Test
    void checkInWithReservationFulfillsAndOccupies() {
        ParkingSlot slot = slot(SlotStatus.RESERVED);
        com.parkmaster.reservation.Reservation reservation =
                new com.parkmaster.reservation.Reservation(
                        new com.parkmaster.user.User("d@x.com", "h", "D",
                                com.parkmaster.user.Role.USER),
                        slot, new VehicleType("Car", null), "51A-999",
                        java.time.Instant.now().plusSeconds(600));
        when(reservationService.consumeForCheckIn(5L)).thenReturn(reservation);
        when(sessions.save(any(ParkingSession.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.checkIn(new CheckInRequest(null, null, null, null, 5L));

        assertThat(resp.licensePlate()).isEqualTo("51A-999");
        assertThat(resp.status()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.OCCUPIED);
    }

    @Test
    void checkOutRejectsClosedSession() {
        ParkingSession session = new ParkingSession(slot(SlotStatus.OCCUPIED),
                new VehicleType("Car", null), "51A-123", false);
        session.setStatus(SessionStatus.COMPLETED);
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        assertThatThrownBy(() -> service.checkOut(1L)).isInstanceOf(ApiException.class);
    }

    @Test
    void checkOutWithoutPolicyRejected() {
        VehicleType car = new VehicleType("Car", null);
        ParkingSession session = new ParkingSession(slot(SlotStatus.OCCUPIED), car, "51A-123", false);
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(policies.findByVehicleTypeId(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.checkOut(1L)).isInstanceOf(ApiException.class);
    }

    @Test
    void checkOutFreeExitCompletesAndFreesSlot() {
        // check-in == now within grace, so charge is zero: nothing to settle.
        VehicleType car = new VehicleType("Car", null);
        ParkingSlot slot = slot(SlotStatus.OCCUPIED);
        ParkingSession session = new ParkingSession(slot, car, "51A-123", false);
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(policies.findByVehicleTypeId(any()))
                .thenReturn(Optional.of(new PricingPolicy(car, new BigDecimal("3.00"), null, 0)));
        var resp = service.checkOut(1L);
        assertThat(resp.status()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(resp.checkOutAt()).isNotNull();
        assertThat(resp.amountCharged()).isEqualByComparingTo("0.00");
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        verify(payments).createForSession(session, session.getAmountCharged());
    }

    @Test
    void checkOutWithChargeAwaitsPaymentAndKeepsSlotOccupied() {
        VehicleType car = new VehicleType("Car", null);
        ParkingSlot slot = slot(SlotStatus.OCCUPIED);
        ParkingSession session = new ParkingSession(slot, car, "51A-123", false);
        session.setCheckInAt(java.time.Instant.now().minusSeconds(2 * 3600));
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(policies.findByVehicleTypeId(any()))
                .thenReturn(Optional.of(new PricingPolicy(car, new BigDecimal("3.00"), null, 0)));

        var resp = service.checkOut(1L);

        assertThat(resp.status()).isEqualTo(SessionStatus.AWAITING_PAYMENT);
        assertThat(resp.amountCharged()).isEqualByComparingTo("6.00");
        // Slot must NOT be freed while the charge is unpaid (car still present).
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.OCCUPIED);
        verify(payments).createForSession(session, session.getAmountCharged());
    }

    @Test
    void getForUserReturnsOwnSession() {
        ParkingSession session = new ParkingSession(slot(SlotStatus.OCCUPIED),
                new VehicleType("Car", null), "51A-123", false);
        session.setUser(new com.parkmaster.user.User("d@x.com", "h", "D",
                com.parkmaster.user.Role.USER));
        when(sessions.findById(7L)).thenReturn(Optional.of(session));

        var resp = service.getForUser("d@x.com", 7L);

        assertThat(resp.licensePlate()).isEqualTo("51A-123");
    }

    @Test
    void getForUserRejectsNonOwner() {
        ParkingSession session = new ParkingSession(slot(SlotStatus.OCCUPIED),
                new VehicleType("Car", null), "51A-123", false);
        session.setUser(new com.parkmaster.user.User("d@x.com", "h", "D",
                com.parkmaster.user.Role.USER));
        when(sessions.findById(7L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.getForUser("other@x.com", 7L))
                .isInstanceOf(ApiException.class);
    }
}
