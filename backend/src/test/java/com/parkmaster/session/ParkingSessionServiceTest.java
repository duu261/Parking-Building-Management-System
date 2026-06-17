package com.parkmaster.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
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
    private ParkingSessionService service;

    @BeforeEach
    void setUp() {
        sessions = Mockito.mock(ParkingSessionRepository.class);
        slots = Mockito.mock(ParkingSlotRepository.class);
        vehicleTypes = Mockito.mock(VehicleTypeRepository.class);
        policies = Mockito.mock(PricingPolicyRepository.class);
        allocation = Mockito.mock(SlotAllocationService.class);
        service = new ParkingSessionService(sessions, slots, vehicleTypes, policies, allocation);
    }

    private ParkingSlot slot(SlotStatus status) {
        ParkingSlot s = new ParkingSlot(new Floor(new ParkingBuilding("B", null), 1, "P1"), "A1");
        s.setStatus(status);
        return s;
    }

    @Test
    void checkInRejectsUnavailableSlot() {
        when(slots.findById(1L)).thenReturn(Optional.of(slot(SlotStatus.OCCUPIED)));
        assertThatThrownBy(() -> service.checkIn(new CheckInRequest(1L, null, 2L, "51A-123")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void checkInRejectsWhenNeitherSlotNorBuilding() {
        assertThatThrownBy(() -> service.checkIn(new CheckInRequest(null, null, 2L, "51A-123")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void checkInOccupiesSlotAndSaves() {
        ParkingSlot slot = slot(SlotStatus.AVAILABLE);
        when(slots.findById(1L)).thenReturn(Optional.of(slot));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(new VehicleType("Car", null)));
        when(sessions.save(any(ParkingSession.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.checkIn(new CheckInRequest(1L, null, 2L, "51A-123"));
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
        var resp = service.checkIn(new CheckInRequest(null, 10L, 2L, "51A-123"));
        assertThat(resp.autoAllocated()).isTrue();
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
    void checkOutChargesAndFreesSlot() {
        VehicleType car = new VehicleType("Car", null);
        ParkingSlot slot = slot(SlotStatus.OCCUPIED);
        ParkingSession session = new ParkingSession(slot, car, "51A-123", false);
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(policies.findByVehicleTypeId(any()))
                .thenReturn(Optional.of(new PricingPolicy(car, new BigDecimal("3.00"), null, 0)));
        var resp = service.checkOut(1L);
        assertThat(resp.status()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(resp.checkOutAt()).isNotNull();
        assertThat(resp.amountCharged()).isNotNull();
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }
}
