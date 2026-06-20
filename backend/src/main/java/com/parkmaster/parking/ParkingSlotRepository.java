package com.parkmaster.parking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByFloorIdOrderByCode(Long floorId);

    boolean existsByFloorIdAndCode(Long floorId, String code);

    List<ParkingSlot> findByFloor_Building_IdAndStatus(Long buildingId, SlotStatus status);

    long countByFloor_Building_Id(Long buildingId);

    long countByFloorId(Long floorId);

    long countByFloorIdAndStatus(Long floorId, SlotStatus status);
}
