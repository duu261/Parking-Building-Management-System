package com.parkmaster.parking;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.ParkingDtos.AllocationAnalytics;
import com.parkmaster.parking.ParkingDtos.BuildingAvailability;
import com.parkmaster.parking.ParkingDtos.BuildingRequest;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingDtos.FloorFillRate;
import com.parkmaster.parking.ParkingDtos.FloorRequest;
import com.parkmaster.parking.ParkingDtos.FloorResponse;
import com.parkmaster.parking.ParkingDtos.SlotRequest;
import com.parkmaster.parking.ParkingDtos.SlotResponse;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParkingService {

    private final ParkingBuildingRepository buildings;
    private final FloorRepository floors;
    private final ParkingSlotRepository slots;
    private final VehicleTypeRepository vehicleTypes;

    public ParkingService(ParkingBuildingRepository buildings, FloorRepository floors,
            ParkingSlotRepository slots, VehicleTypeRepository vehicleTypes) {
        this.buildings = buildings;
        this.floors = floors;
        this.slots = slots;
        this.vehicleTypes = vehicleTypes;
    }

    // --- Buildings ---

    @Transactional
    public BuildingResponse createBuilding(BuildingRequest req) {
        ParkingBuilding b = buildings.save(new ParkingBuilding(req.name(), req.address()));
        return BuildingResponse.from(b);
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> listBuildings() {
        return buildings.findAll().stream().map(BuildingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BuildingResponse getBuilding(Long id) {
        return BuildingResponse.from(building(id));
    }

    /** Public/guest view: how many slots are free in a building right now. */
    @Transactional(readOnly = true)
    public BuildingAvailability getAvailability(Long id) {
        ParkingBuilding b = building(id);
        long available = slots.findByFloor_Building_IdAndStatus(id, SlotStatus.AVAILABLE).size();
        return new BuildingAvailability(b.getId(), b.getName(), available);
    }

    @Transactional
    public BuildingResponse updateBuilding(Long id, BuildingRequest req) {
        ParkingBuilding b = building(id);
        b.setName(req.name());
        b.setAddress(req.address());
        return BuildingResponse.from(b);
    }

    @Transactional
    public void deleteBuilding(Long id) {
        buildings.delete(building(id));
    }

    // --- Floors ---

    @Transactional
    public FloorResponse createFloor(Long buildingId, FloorRequest req) {
        ParkingBuilding b = building(buildingId);
        if (floors.existsByBuildingIdAndLevel(buildingId, req.level())) {
            throw new ApiException(HttpStatus.CONFLICT, "Floor level already exists in this building");
        }
        Floor f = floors.save(new Floor(b, req.level(), req.name()));
        return FloorResponse.from(f);
    }

    @Transactional(readOnly = true)
    public List<FloorResponse> listFloors(Long buildingId) {
        building(buildingId); // 404 if building missing
        return floors.findByBuildingIdOrderByLevel(buildingId).stream().map(FloorResponse::from).toList();
    }

    @Transactional
    public FloorResponse setFloorVehicleType(Long floorId, Long vehicleTypeId) {
        Floor f = floor(floorId);
        if (vehicleTypeId == null) {
            f.setVehicleType(null);
        } else {
            VehicleType vt = vehicleTypes.findById(vehicleTypeId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));
            f.setVehicleType(vt);
        }
        return FloorResponse.from(f);
    }

    @Transactional
    public void deleteFloor(Long id) {
        floors.delete(floor(id));
    }

    // --- Analytics ---

    @Transactional(readOnly = true)
    public AllocationAnalytics getFloorAnalytics(Long buildingId) {
        building(buildingId); // 404 guard
        List<FloorFillRate> fillRates = floors.findByBuildingIdOrderByLevel(buildingId).stream()
                .map(f -> {
                    long total = slots.countByFloorId(f.getId());
                    long occupied = slots.countByFloorIdAndStatus(f.getId(), SlotStatus.OCCUPIED);
                    long available = slots.countByFloorIdAndStatus(f.getId(), SlotStatus.AVAILABLE);
                    double fillRate = total > 0 ? (double) occupied / total : 0.0;
                    Long vtId = f.getVehicleType() != null ? f.getVehicleType().getId() : null;
                    return new FloorFillRate(f.getId(), f.getLevel(), f.getName(), vtId, total,
                            occupied, available, fillRate);
                })
                .toList();
        return new AllocationAnalytics(buildingId, fillRates);
    }

    // --- Slots ---

    @Transactional
    public SlotResponse createSlot(Long floorId, SlotRequest req) {
        Floor f = floor(floorId);
        if (slots.existsByFloorIdAndCode(floorId, req.code())) {
            throw new ApiException(HttpStatus.CONFLICT, "Slot code already exists on this floor");
        }
        ParkingSlot s = slots.save(new ParkingSlot(f, req.code()));
        return SlotResponse.from(s);
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> listSlots(Long floorId) {
        floor(floorId); // 404 if floor missing
        return slots.findByFloorIdOrderByCode(floorId).stream().map(SlotResponse::from).toList();
    }

    @Transactional
    public SlotResponse updateSlotStatus(Long id, SlotStatus status) {
        ParkingSlot s = slots.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Slot not found"));
        s.setStatus(status);
        return SlotResponse.from(s);
    }

    @Transactional
    public void deleteSlot(Long id) {
        ParkingSlot s = slots.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Slot not found"));
        slots.delete(s);
    }

    private ParkingBuilding building(Long id) {
        return buildings.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Building not found"));
    }

    private Floor floor(Long id) {
        return floors.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Floor not found"));
    }
}
