package com.parkmaster.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pricing.VehicleType;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for SlotAllocationService — repositories mocked, no Spring context. */
class SlotAllocationServiceTest {

    private ParkingSlotRepository slots;
    private SlotAllocationService service;

    private final ParkingBuilding building = new ParkingBuilding("B1", null);
    private final VehicleType car = new VehicleType("Car", null);
    private final VehicleType bike = new VehicleType("Bike", null);

    @BeforeEach
    void setUp() {
        car.setId(1L);
        bike.setId(2L);
        slots = Mockito.mock(ParkingSlotRepository.class);
        service = new SlotAllocationService(slots);
    }

    private long floorIdSeq = 1;

    private Floor floor(int level, VehicleType vehicleType) {
        Floor f = new Floor(building, level, "F" + level);
        f.setId(floorIdSeq++);
        f.setVehicleType(vehicleType);
        return f;
    }

    private ParkingSlot slot(Floor floor, String code) {
        ParkingSlot s = new ParkingSlot(floor, code);
        s.setStatus(SlotStatus.AVAILABLE);
        return s;
    }

    @Test
    void throwsWhenNoBuildingSlots() {
        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of());
        assertThatThrownBy(() -> service.allocate(1L, 1L)).isInstanceOf(ApiException.class);
    }

    @Test
    void prefersVehicleTypeMatchOverDistance() {
        Floor groundMixed = floor(1, null);   // level 1, no type — neutral score
        Floor upperCar = floor(2, car);       // level 2, car match — high vehicle score

        ParkingSlot groundSlot = slot(groundMixed, "A1");
        ParkingSlot upperSlot = slot(upperCar, "B1");

        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of(groundSlot, upperSlot));
        when(slots.countByFloorId(groundMixed.getId())).thenReturn(5L);
        when(slots.countByFloorId(upperCar.getId())).thenReturn(5L);

        // car floor gets +40 (type match) vs ground +20 (mixed), even though ground is closer
        ParkingSlot chosen = service.allocate(1L, car.getId());
        assertThat(chosen).isEqualTo(upperSlot);
    }

    @Test
    void prefersLowerFloorWhenNoTypeDesignation() {
        Floor f1 = floor(1, null);
        Floor f2 = floor(2, null);

        ParkingSlot s1 = slot(f1, "A1");
        ParkingSlot s2 = slot(f2, "B1");

        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of(s1, s2));
        when(slots.countByFloorId(f1.getId())).thenReturn(2L);
        when(slots.countByFloorId(f2.getId())).thenReturn(2L);

        ParkingSlot chosen = service.allocate(1L, car.getId());
        assertThat(chosen).isEqualTo(s1); // level 1: distScore=20, level 2: distScore=10
    }

    @Test
    void prefersHigherLoadBalanceWhenEquallySized() {
        // Two floors with same type designation, same level — more available wins
        Floor f1 = floor(1, car);
        Floor f2 = floor(1, car);

        ParkingSlot s1 = slot(f1, "A1");
        ParkingSlot s2 = slot(f2, "B1");

        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of(s1, s2));
        // f1 has 1/2 available (50%), f2 has 1/10 available (10%)
        when(slots.countByFloorId(f1.getId())).thenReturn(2L);
        when(slots.countByFloorId(f2.getId())).thenReturn(10L);

        ParkingSlot chosen = service.allocate(1L, car.getId());
        assertThat(chosen).isEqualTo(s1); // higher available ratio
    }

    @Test
    void rankOrdersBestFirstWithBreakdownSummingToTotal() {
        Floor bikeFloor = floor(1, bike);  // wrong type for a car request
        Floor carFloor = floor(2, car);    // type match

        ParkingSlot bikeSlot = slot(bikeFloor, "B1");
        ParkingSlot carSlot = slot(carFloor, "C1");

        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of(bikeSlot, carSlot));
        when(slots.countByFloorId(bikeFloor.getId())).thenReturn(2L);
        when(slots.countByFloorId(carFloor.getId())).thenReturn(2L);

        List<SlotAllocationService.ScoreBreakdown> ranked = service.rank(1L, car.getId());

        assertThat(ranked).hasSize(2);
        assertThat(ranked.get(0).slot()).isEqualTo(carSlot); // type match ranks first
        assertThat(ranked.get(0).total()).isGreaterThan(ranked.get(1).total());
        var top = ranked.get(0);
        assertThat(top.vehicleTypeMatch() + top.loadBalance() + top.distanceToEntry()
                + top.peakHour()).isEqualTo(top.total());
    }

    @Test
    void rejectsBikeSlotForCarRequest() {
        Floor bikeFloor = floor(1, bike);
        Floor carFloor = floor(2, car);

        ParkingSlot bikeSlot = slot(bikeFloor, "B1");
        ParkingSlot carSlot = slot(carFloor, "C1");

        when(slots.findByFloor_Building_IdAndStatus(1L, SlotStatus.AVAILABLE))
                .thenReturn(List.of(bikeSlot, carSlot));
        when(slots.countByFloorId(bikeFloor.getId())).thenReturn(2L);
        when(slots.countByFloorId(carFloor.getId())).thenReturn(2L);

        // bikeFloor: vtScore=0, carFloor: vtScore=40 — car floor must win
        ParkingSlot chosen = service.allocate(1L, car.getId());
        assertThat(chosen).isEqualTo(carSlot);
    }
}
