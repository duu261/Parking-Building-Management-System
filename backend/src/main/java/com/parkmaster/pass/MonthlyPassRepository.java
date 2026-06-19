package com.parkmaster.pass;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyPassRepository extends JpaRepository<MonthlyPass, Long> {

    // Checkout lookup: an ACTIVE pass for this plate+type whose window covers onDate.
    // Date range filtered in DB so a stale ACTIVE row past valid_until is not honored.
    boolean existsByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqual(
            String licensePlate, Long vehicleTypeId, PassStatus status,
            LocalDate onDateForFrom, LocalDate onDateForUntil);

    // Used by the duplicate-overlap guard in issue().
    List<MonthlyPass> findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatus(
            String licensePlate, Long vehicleTypeId, PassStatus status);

    List<MonthlyPass> findAllByOrderByCreatedAtDesc();
}
