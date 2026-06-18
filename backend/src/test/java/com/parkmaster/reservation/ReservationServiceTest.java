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
import java.time.Duration;
import java.time.Instant;
import java.util.List;
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

    private Reservation pending(User owner, ParkingSlot slot) {
        Reservation r = new Reservation(owner, slot, new VehicleType("Car", null), "51A-123",
                Instant.now().plus(Duration.ofMinutes(30)));
        r.setStatus(ReservationStatus.PENDING);
        return r;
    }

    @Test
    void listForUserReturnsOwnReservations() {
        User driver = driver();
        when(reservations.findByUser_EmailOrderByCreatedAtDesc("driver@x.com"))
                .thenReturn(List.of(pending(driver, slot(SlotStatus.RESERVED))));
        var result = service.listForUser("driver@x.com");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    void cancelByOwnerReleasesSlot() {
        ParkingSlot slot = slot(SlotStatus.RESERVED);
        Reservation r = pending(driver(), slot);
        when(reservations.findById(1L)).thenReturn(Optional.of(r));

        service.cancel("driver@x.com", 1L);

        assertThat(r.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void cancelByNonOwnerRejectedAsNotFound() {
        Reservation r = pending(driver(), slot(SlotStatus.RESERVED));
        when(reservations.findById(1L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.cancel("someoneelse@x.com", 1L))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void cancelNonPendingRejected() {
        Reservation r = pending(driver(), slot(SlotStatus.RESERVED));
        r.setStatus(ReservationStatus.FULFILLED);
        when(reservations.findById(1L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.cancel("driver@x.com", 1L))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void sweepExpiredReleasesSlotsAndMarksExpired() {
        ParkingSlot slot = slot(SlotStatus.RESERVED);
        Reservation r = pending(driver(), slot);
        when(reservations.findByStatusAndHoldUntilBefore(
                org.mockito.ArgumentMatchers.eq(ReservationStatus.PENDING),
                any(Instant.class))).thenReturn(List.of(r));

        int swept = service.sweepExpired();

        assertThat(swept).isEqualTo(1);
        assertThat(r.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void consumeForCheckInMarksFulfilled() {
        Reservation r = pending(driver(), slot(SlotStatus.RESERVED));
        when(reservations.findById(1L)).thenReturn(Optional.of(r));
        Reservation consumed = service.consumeForCheckIn(1L);
        assertThat(consumed.getStatus()).isEqualTo(ReservationStatus.FULFILLED);
    }

    @Test
    void consumeForCheckInRejectsExpired() {
        Reservation r = pending(driver(), slot(SlotStatus.RESERVED));
        r.setHoldUntil(Instant.now().minusSeconds(1));
        when(reservations.findById(1L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.consumeForCheckIn(1L)).isInstanceOf(ApiException.class);
    }

    @Test
    void consumeForCheckInRejectsNonPending() {
        Reservation r = pending(driver(), slot(SlotStatus.RESERVED));
        r.setStatus(ReservationStatus.CANCELLED);
        when(reservations.findById(1L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.consumeForCheckIn(1L)).isInstanceOf(ApiException.class);
    }
}
