package com.parkmaster.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.session.SlotAllocationService;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for ReservationService — repositories mocked, no Spring context. */
class ReservationServiceTest {

    private ReservationRepository reservations;
    private UserRepository users;
    private VehicleTypeRepository vehicleTypes;
    private SlotAllocationService allocation;
    private ReservationService service;

    @BeforeEach
    void setUp() {
        reservations = Mockito.mock(ReservationRepository.class);
        users = Mockito.mock(UserRepository.class);
        vehicleTypes = Mockito.mock(VehicleTypeRepository.class);
        allocation = Mockito.mock(SlotAllocationService.class);
        service = new ReservationService(reservations, users, vehicleTypes, allocation);
    }

    private ParkingSlot slot(SlotStatus status) {
        ParkingSlot s = new ParkingSlot(new Floor(new ParkingBuilding("B", null), 1, "P1"), "A1");
        s.setStatus(status);
        return s;
    }

    private User driver() {
        return new User("driver@x.com", "hash", "Driver", Role.USER);
    }

    @Test
    void createHoldsSlotAndReturnsPending() {
        ParkingSlot slot = slot(SlotStatus.AVAILABLE);
        when(users.findByEmail("driver@x.com")).thenReturn(Optional.of(driver()));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(new VehicleType("Car", null)));
        when(allocation.allocate(10L, 2L)).thenReturn(slot);
        when(reservations.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.create("driver@x.com", 10L, 2L, "51A-123");

        assertThat(resp.status()).isEqualTo(ReservationStatus.PENDING);
        assertThat(resp.slotCode()).isEqualTo("A1");
        assertThat(resp.licensePlate()).isEqualTo("51A-123");
        assertThat(resp.holdUntil()).isAfter(Instant.now());
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.RESERVED);
    }

    @Test
    void createRejectsWhenAllocatedSlotNotAvailable() {
        // Allocator returns a slot that was taken concurrently (already RESERVED).
        when(users.findByEmail("driver@x.com")).thenReturn(Optional.of(driver()));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(new VehicleType("Car", null)));
        when(allocation.allocate(10L, 2L)).thenReturn(slot(SlotStatus.RESERVED));

        assertThatThrownBy(() -> service.create("driver@x.com", 10L, 2L, "51A-123"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void createRejectsUnknownUser() {
        when(users.findByEmail("ghost@x.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create("ghost@x.com", 10L, 2L, "51A-123"))
                .isInstanceOf(ApiException.class);
    }
}
