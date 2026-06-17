package com.parkmaster.pricing;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long> {
    List<VehicleType> findAllByOrderByName();

    boolean existsByNameIgnoreCase(String name);
}
