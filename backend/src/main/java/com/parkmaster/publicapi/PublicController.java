package com.parkmaster.publicapi;

import com.parkmaster.parking.ParkingDtos.BuildingAvailability;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.pricing.PricingDtos.PricingPolicyResponse;
import com.parkmaster.pricing.PricingService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Guest/SEO surface: no auth. Read-only overview, pricing, live availability.
@RestController
@RequestMapping("/api/public")
class PublicController {

    private final ParkingService parking;
    private final PricingService pricing;

    PublicController(ParkingService parking, PricingService pricing) {
        this.parking = parking;
        this.pricing = pricing;
    }

    @GetMapping("/health")
    Map<String, Object> health() {
        return Map.of("status", "UP", "service", "parkmaster-api", "time", Instant.now().toString());
    }

    @GetMapping("/buildings")
    List<BuildingResponse> buildings() {
        return parking.listBuildings();
    }

    @GetMapping("/buildings/{id}/availability")
    BuildingAvailability availability(@PathVariable Long id) {
        return parking.getAvailability(id);
    }

    @GetMapping("/pricing")
    List<PricingPolicyResponse> pricing() {
        return pricing.listPolicies();
    }
}
