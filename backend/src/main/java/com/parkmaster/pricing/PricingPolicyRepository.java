package com.parkmaster.pricing;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingPolicyRepository extends JpaRepository<PricingPolicy, Long> {
    List<PricingPolicy> findAllByOrderByVehicleTypeName();

    Optional<PricingPolicy> findByVehicleTypeId(Long vehicleTypeId);

    boolean existsByVehicleTypeId(Long vehicleTypeId);
}
