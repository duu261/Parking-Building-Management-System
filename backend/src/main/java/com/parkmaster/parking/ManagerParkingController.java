package com.parkmaster.parking;

import com.parkmaster.parking.ParkingDtos.AllocationAnalytics;
import com.parkmaster.parking.ParkingDtos.BuildingRequest;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingDtos.FloorRequest;
import com.parkmaster.parking.ParkingDtos.FloorResponse;
import com.parkmaster.parking.ParkingDtos.FloorVehicleTypeRequest;
import com.parkmaster.parking.ParkingDtos.SlotRequest;
import com.parkmaster.parking.ParkingDtos.SlotResponse;
import com.parkmaster.parking.ParkingDtos.SlotStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
class ManagerParkingController {

    private final ParkingService parking;

    ManagerParkingController(ParkingService parking) {
        this.parking = parking;
    }

    // --- Buildings ---

    @PostMapping("/buildings")
    ResponseEntity<BuildingResponse> createBuilding(@Valid @RequestBody BuildingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parking.createBuilding(req));
    }

    @GetMapping("/buildings")
    List<BuildingResponse> listBuildings() {
        return parking.listBuildings();
    }

    @GetMapping("/buildings/{id}")
    BuildingResponse getBuilding(@PathVariable Long id) {
        return parking.getBuilding(id);
    }

    @PutMapping("/buildings/{id}")
    BuildingResponse updateBuilding(@PathVariable Long id, @Valid @RequestBody BuildingRequest req) {
        return parking.updateBuilding(id, req);
    }

    @DeleteMapping("/buildings/{id}")
    ResponseEntity<Void> deleteBuilding(@PathVariable Long id) {
        parking.deleteBuilding(id);
        return ResponseEntity.noContent().build();
    }

    // --- Floors ---

    @PostMapping("/buildings/{buildingId}/floors")
    ResponseEntity<FloorResponse> createFloor(@PathVariable Long buildingId,
            @Valid @RequestBody FloorRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parking.createFloor(buildingId, req));
    }

    @GetMapping("/buildings/{buildingId}/floors")
    List<FloorResponse> listFloors(@PathVariable Long buildingId) {
        return parking.listFloors(buildingId);
    }

    @PatchMapping("/floors/{id}/vehicle-type")
    FloorResponse setFloorVehicleType(@PathVariable Long id,
            @RequestBody FloorVehicleTypeRequest req) {
        return parking.setFloorVehicleType(id, req.vehicleTypeId());
    }

    @DeleteMapping("/floors/{id}")
    ResponseEntity<Void> deleteFloor(@PathVariable Long id) {
        parking.deleteFloor(id);
        return ResponseEntity.noContent().build();
    }

    // --- Analytics ---

    @GetMapping("/buildings/{buildingId}/analytics/allocation")
    AllocationAnalytics getAllocationAnalytics(@PathVariable Long buildingId) {
        return parking.getFloorAnalytics(buildingId);
    }

    // --- Slots ---

    @PostMapping("/floors/{floorId}/slots")
    ResponseEntity<SlotResponse> createSlot(@PathVariable Long floorId,
            @Valid @RequestBody SlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parking.createSlot(floorId, req));
    }

    @GetMapping("/floors/{floorId}/slots")
    List<SlotResponse> listSlots(@PathVariable Long floorId) {
        return parking.listSlots(floorId);
    }

    @PatchMapping("/slots/{id}/status")
    SlotResponse updateSlotStatus(@PathVariable Long id, @Valid @RequestBody SlotStatusRequest req) {
        return parking.updateSlotStatus(id, req.status());
    }

    @DeleteMapping("/slots/{id}")
    ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        parking.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}
