package com.parkmaster.parking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByBuildingIdOrderByLevel(Long buildingId);

    boolean existsByBuildingIdAndLevel(Long buildingId, int level);
}
