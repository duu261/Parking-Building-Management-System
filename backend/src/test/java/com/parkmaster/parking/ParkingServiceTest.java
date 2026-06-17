package com.parkmaster.parking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.ParkingDtos.FloorRequest;
import com.parkmaster.parking.ParkingDtos.SlotRequest;
import com.parkmaster.pricing.VehicleTypeRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for ParkingService — repositories mocked, no Spring context. */
class ParkingServiceTest {

    private ParkingBuildingRepository buildings;
    private FloorRepository floors;
    private ParkingSlotRepository slots;
    private VehicleTypeRepository vehicleTypes;
    private ParkingService service;

    @BeforeEach
    void setUp() {
        buildings = Mockito.mock(ParkingBuildingRepository.class);
        floors = Mockito.mock(FloorRepository.class);
        slots = Mockito.mock(ParkingSlotRepository.class);
        vehicleTypes = Mockito.mock(VehicleTypeRepository.class);
        service = new ParkingService(buildings, floors, slots, vehicleTypes);
    }

    @Test
    void getMissingBuildingThrows() {
        when(buildings.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getBuilding(99L)).isInstanceOf(ApiException.class);
    }

    @Test
    void duplicateFloorLevelRejected() {
        when(buildings.findById(1L)).thenReturn(Optional.of(new ParkingBuilding("B", null)));
        when(floors.existsByBuildingIdAndLevel(1L, 2)).thenReturn(true);
        assertThatThrownBy(() -> service.createFloor(1L, new FloorRequest(2, "P2")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void duplicateSlotCodeRejected() {
        when(floors.findById(1L)).thenReturn(Optional.of(new Floor(new ParkingBuilding("B", null), 1, "P1")));
        when(slots.existsByFloorIdAndCode(1L, "A1")).thenReturn(true);
        assertThatThrownBy(() -> service.createSlot(1L, new SlotRequest("A1")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void updateSlotStatusChangesStatus() {
        ParkingSlot slot = new ParkingSlot(new Floor(new ParkingBuilding("B", null), 1, "P1"), "A1");
        when(slots.findById(1L)).thenReturn(Optional.of(slot));
        var resp = service.updateSlotStatus(1L, SlotStatus.OCCUPIED);
        assertThat(resp.status()).isEqualTo(SlotStatus.OCCUPIED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.OCCUPIED);
    }

    @Test
    void createSlotPersistsAndReturns() {
        Floor f = new Floor(new ParkingBuilding("B", null), 1, "P1");
        when(floors.findById(1L)).thenReturn(Optional.of(f));
        when(slots.existsByFloorIdAndCode(1L, "A1")).thenReturn(false);
        when(slots.save(any(ParkingSlot.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.createSlot(1L, new SlotRequest("A1"));
        assertThat(resp.code()).isEqualTo("A1");
        assertThat(resp.status()).isEqualTo(SlotStatus.AVAILABLE);
    }
}
