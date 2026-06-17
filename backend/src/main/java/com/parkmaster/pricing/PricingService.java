package com.parkmaster.pricing;

import com.parkmaster.common.ApiException;
import com.parkmaster.pricing.PricingDtos.PricingPolicyRequest;
import com.parkmaster.pricing.PricingDtos.PricingPolicyResponse;
import com.parkmaster.pricing.PricingDtos.VehicleTypeRequest;
import com.parkmaster.pricing.PricingDtos.VehicleTypeResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PricingService {

    private final VehicleTypeRepository vehicleTypes;
    private final PricingPolicyRepository policies;

    public PricingService(VehicleTypeRepository vehicleTypes, PricingPolicyRepository policies) {
        this.vehicleTypes = vehicleTypes;
        this.policies = policies;
    }

    // --- Vehicle types ---

    @Transactional
    public VehicleTypeResponse createVehicleType(VehicleTypeRequest req) {
        if (vehicleTypes.existsByNameIgnoreCase(req.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "Vehicle type name already exists");
        }
        VehicleType v = vehicleTypes.save(new VehicleType(req.name(), req.description()));
        return VehicleTypeResponse.from(v);
    }

    @Transactional(readOnly = true)
    public List<VehicleTypeResponse> listVehicleTypes() {
        return vehicleTypes.findAllByOrderByName().stream().map(VehicleTypeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public VehicleTypeResponse getVehicleType(Long id) {
        return VehicleTypeResponse.from(vehicleType(id));
    }

    @Transactional
    public VehicleTypeResponse updateVehicleType(Long id, VehicleTypeRequest req) {
        VehicleType v = vehicleType(id);
        if (!v.getName().equalsIgnoreCase(req.name()) && vehicleTypes.existsByNameIgnoreCase(req.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "Vehicle type name already exists");
        }
        v.setName(req.name());
        v.setDescription(req.description());
        return VehicleTypeResponse.from(v);
    }

    @Transactional
    public void deleteVehicleType(Long id) {
        vehicleTypes.delete(vehicleType(id));
    }

    // --- Pricing policies ---

    @Transactional
    public PricingPolicyResponse setPolicy(Long vehicleTypeId, PricingPolicyRequest req) {
        VehicleType v = vehicleType(vehicleTypeId);
        PricingPolicy p = policies.findByVehicleTypeId(vehicleTypeId)
                .orElseGet(() -> new PricingPolicy(v, req.ratePerHour(), req.dailyCap(),
                        req.graceMinutes()));
        p.setRatePerHour(req.ratePerHour());
        p.setDailyCap(req.dailyCap());
        p.setGraceMinutes(req.graceMinutes());
        p.setPeakMultiplier(req.peakMultiplier());
        return PricingPolicyResponse.from(policies.save(p));
    }

    @Transactional(readOnly = true)
    public List<PricingPolicyResponse> listPolicies() {
        return policies.findAllByOrderByVehicleTypeName().stream()
                .map(PricingPolicyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PricingPolicyResponse getPolicy(Long vehicleTypeId) {
        vehicleType(vehicleTypeId); // 404 if vehicle type missing
        PricingPolicy p = policies.findByVehicleTypeId(vehicleTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No pricing policy for this vehicle type"));
        return PricingPolicyResponse.from(p);
    }

    @Transactional
    public void deletePolicy(Long vehicleTypeId) {
        PricingPolicy p = policies.findByVehicleTypeId(vehicleTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No pricing policy for this vehicle type"));
        policies.delete(p);
    }

    private VehicleType vehicleType(Long id) {
        return vehicleTypes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));
    }
}
