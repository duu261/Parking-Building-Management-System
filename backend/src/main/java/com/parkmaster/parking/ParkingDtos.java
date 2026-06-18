package com.parkmaster.parking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class ParkingDtos {

    private ParkingDtos() {}

    public record BuildingRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 255) String address) {}

    public record BuildingResponse(Long id, String name, String address, Instant createdAt) {
        static BuildingResponse from(ParkingBuilding b) {
            return new BuildingResponse(b.getId(), b.getName(), b.getAddress(), b.getCreatedAt());
        }
    }

    public record FloorRequest(
            int level,
            @NotBlank @Size(max = 60) String name) {}

    public record FloorVehicleTypeRequest(Long vehicleTypeId) {}

    public record FloorResponse(Long id, Long buildingId, Long vehicleTypeId, int level,
            String name) {
        static FloorResponse from(Floor f) {
            Long vtId = f.getVehicleType() != null ? f.getVehicleType().getId() : null;
            return new FloorResponse(f.getId(), f.getBuilding().getId(), vtId, f.getLevel(),
                    f.getName());
        }
    }

    public record SlotRequest(@NotBlank @Size(max = 20) String code) {}

    public record SlotStatusRequest(@NotNull SlotStatus status) {}

    public record SlotResponse(Long id, Long floorId, String code, SlotStatus status) {
        static SlotResponse from(ParkingSlot s) {
            return new SlotResponse(s.getId(), s.getFloor().getId(), s.getCode(), s.getStatus());
        }
    }

    public record FloorFillRate(Long floorId, int level, String name, Long vehicleTypeId,
            long totalSlots, long occupiedSlots, long availableSlots, double fillRate) {}

    public record AllocationAnalytics(Long buildingId, List<FloorFillRate> floors) {}

    public record BuildingAvailability(Long buildingId, String name, long availableSlots) {}
}
