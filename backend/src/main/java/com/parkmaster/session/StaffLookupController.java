package com.parkmaster.session;

import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingDtos.FloorResponse;
import com.parkmaster.parking.ParkingDtos.SlotResponse;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.pass.MonthlyPassService;
import com.parkmaster.pricing.PricingDtos.VehicleTypeResponse;
import com.parkmaster.pricing.PricingService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff")
class StaffLookupController {

    private final ParkingService parking;
    private final PricingService pricing;
    private final MonthlyPassService passes;

    StaffLookupController(ParkingService parking, PricingService pricing, MonthlyPassService passes) {
        this.parking = parking;
        this.pricing = pricing;
        this.passes = passes;
    }

    @GetMapping("/vehicle-types")
    List<VehicleTypeResponse> vehicleTypes() {
        return pricing.listVehicleTypes();
    }

    @GetMapping("/buildings")
    List<BuildingResponse> buildings() {
        return parking.listBuildings();
    }

    @GetMapping("/buildings/{buildingId}/floors")
    List<FloorResponse> floors(@PathVariable Long buildingId) {
        return parking.listFloors(buildingId);
    }

    @GetMapping("/floors/{floorId}/slots")
    List<SlotResponse> slots(@PathVariable Long floorId) {
        return parking.listSlots(floorId);
    }

    @GetMapping("/pass-lookup")
    com.parkmaster.pass.PassDtos.PassResponse passByPlate(@RequestParam String plate) {
        return passes.findActiveByPlate(plate);
    }
}
