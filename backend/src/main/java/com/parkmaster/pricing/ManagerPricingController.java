package com.parkmaster.pricing;

import com.parkmaster.pricing.PricingDtos.PricingPolicyRequest;
import com.parkmaster.pricing.PricingDtos.PricingPolicyResponse;
import com.parkmaster.pricing.PricingDtos.VehicleTypeRequest;
import com.parkmaster.pricing.PricingDtos.VehicleTypeResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
class ManagerPricingController {

    private final PricingService pricing;

    ManagerPricingController(PricingService pricing) {
        this.pricing = pricing;
    }

    // --- Vehicle types ---

    @PostMapping("/vehicle-types")
    ResponseEntity<VehicleTypeResponse> createVehicleType(@Valid @RequestBody VehicleTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pricing.createVehicleType(req));
    }

    @GetMapping("/vehicle-types")
    List<VehicleTypeResponse> listVehicleTypes() {
        return pricing.listVehicleTypes();
    }

    @GetMapping("/vehicle-types/{id}")
    VehicleTypeResponse getVehicleType(@PathVariable Long id) {
        return pricing.getVehicleType(id);
    }

    @PutMapping("/vehicle-types/{id}")
    VehicleTypeResponse updateVehicleType(@PathVariable Long id,
            @Valid @RequestBody VehicleTypeRequest req) {
        return pricing.updateVehicleType(id, req);
    }

    @DeleteMapping("/vehicle-types/{id}")
    ResponseEntity<Void> deleteVehicleType(@PathVariable Long id) {
        pricing.deleteVehicleType(id);
        return ResponseEntity.noContent().build();
    }

    // --- Pricing policies (one per vehicle type) ---

    @PutMapping("/vehicle-types/{vehicleTypeId}/pricing")
    PricingPolicyResponse setPolicy(@PathVariable Long vehicleTypeId,
            @Valid @RequestBody PricingPolicyRequest req) {
        return pricing.setPolicy(vehicleTypeId, req);
    }

    @GetMapping("/vehicle-types/{vehicleTypeId}/pricing")
    PricingPolicyResponse getPolicy(@PathVariable Long vehicleTypeId) {
        return pricing.getPolicy(vehicleTypeId);
    }

    @DeleteMapping("/vehicle-types/{vehicleTypeId}/pricing")
    ResponseEntity<Void> deletePolicy(@PathVariable Long vehicleTypeId) {
        pricing.deletePolicy(vehicleTypeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pricing")
    List<PricingPolicyResponse> listPolicies() {
        return pricing.listPolicies();
    }
}
