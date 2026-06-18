package com.parkmaster.publicapi;

import com.parkmaster.parking.ParkingDtos.BuildingAvailability;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.pricing.PricingDtos.PricingPolicyResponse;
import com.parkmaster.pricing.PricingService;
import com.parkmaster.session.SlotAllocationService;
import com.parkmaster.session.SlotAllocationService.ScoreBreakdown;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Guest/SEO surface: no auth. Read-only overview, pricing, live availability.
@RestController
@RequestMapping("/api/public")
class PublicController {

    private static final int MAX_PREVIEW = 12;

    private final ParkingService parking;
    private final PricingService pricing;
    private final SlotAllocationService allocation;

    PublicController(ParkingService parking, PricingService pricing,
            SlotAllocationService allocation) {
        this.parking = parking;
        this.pricing = pricing;
        this.allocation = allocation;
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

    // Live look at the AI slot allocator: available slots scored best-first, with the
    // per-criterion breakdown so the demo can show WHY the top slot wins (RQ2-RQ4).
    @GetMapping("/buildings/{id}/allocation-preview")
    List<AllocationCandidate> allocationPreview(@PathVariable Long id,
            @RequestParam Long vehicleTypeId,
            @RequestParam(defaultValue = "6") int limit) {
        int capped = Math.max(1, Math.min(limit, MAX_PREVIEW));
        return allocation.rank(id, vehicleTypeId).stream()
                .limit(capped)
                .map(AllocationCandidate::from)
                .toList();
    }

    record AllocationCandidate(Long slotId, String slotCode, Long floorId, String floorName,
            int level, double vehicleTypeMatch, double loadBalance, double distanceToEntry,
            double peakHour, double total) {

        static AllocationCandidate from(ScoreBreakdown b) {
            var slot = b.slot();
            var floor = slot.getFloor();
            return new AllocationCandidate(slot.getId(), slot.getCode(), floor.getId(),
                    floor.getName(), floor.getLevel(), round(b.vehicleTypeMatch()),
                    round(b.loadBalance()), round(b.distanceToEntry()), round(b.peakHour()),
                    round(b.total()));
        }

        private static double round(double v) {
            return Math.round(v * 10.0) / 10.0;
        }
    }
}
