package com.parkmaster.session;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scores available slots and picks the best one.
 *
 * Score = vehicleTypeMatch(40) + loadBalance(30) + distanceToEntry(20) + peakHour(10)
 *
 * Answers RQ2 (auto vs manual), RQ3 (which criteria matter), RQ4 (peak-hour utilization).
 */
@Service
public class SlotAllocationService {

    private static final int WEIGHT_VEHICLE_TYPE = 40;
    private static final int WEIGHT_LOAD_BALANCE = 30;
    private static final int WEIGHT_DISTANCE = 20;
    private static final int WEIGHT_PEAK_HOUR = 10;

    // Peak hours: 7-9 AM and 5-7 PM local time (Vietnam)
    private static final Set<Integer> PEAK_HOURS = Set.of(7, 8, 17, 18);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ParkingSlotRepository slots;

    public SlotAllocationService(ParkingSlotRepository slots) {
        this.slots = slots;
    }

    @Transactional(readOnly = true)
    public ParkingSlot allocate(Long buildingId, Long vehicleTypeId) {
        List<ParkingSlot> available =
                slots.findByFloor_Building_IdAndStatus(buildingId, SlotStatus.AVAILABLE);
        if (available.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "No available slots in building");
        }

        Map<Long, Long> floorAvailableCount = available.stream()
                .collect(Collectors.groupingBy(s -> s.getFloor().getId(), Collectors.counting()));

        Map<Long, Long> floorTotalCount = floorAvailableCount.keySet().stream()
                .collect(Collectors.toMap(fId -> fId, slots::countByFloorId));

        boolean peak = isPeakHour();

        return available.stream()
                .max(Comparator.comparingDouble(
                        s -> score(s, vehicleTypeId, floorAvailableCount, floorTotalCount, peak)))
                .orElseThrow();
    }

    private double score(ParkingSlot slot, Long vehicleTypeId,
            Map<Long, Long> floorAvailableCount, Map<Long, Long> floorTotalCount, boolean peak) {
        Floor floor = slot.getFloor();
        long total = floorTotalCount.getOrDefault(floor.getId(), 1L);
        long available = floorAvailableCount.getOrDefault(floor.getId(), 0L);
        double availableRatio = (double) available / total;

        double vtScore = vehicleTypeScore(floor, vehicleTypeId);
        double loadScore = availableRatio * WEIGHT_LOAD_BALANCE;
        double distScore = (double) WEIGHT_DISTANCE / floor.getLevel();
        double peakScore = peak ? availableRatio * WEIGHT_PEAK_HOUR : 0;

        return vtScore + loadScore + distScore + peakScore;
    }

    private double vehicleTypeScore(Floor floor, Long vehicleTypeId) {
        if (floor.getVehicleType() == null) {
            return WEIGHT_VEHICLE_TYPE / 2.0; // mixed floor: neutral
        }
        return floor.getVehicleType().getId().equals(vehicleTypeId) ? WEIGHT_VEHICLE_TYPE : 0;
    }

    static boolean isPeakHour() {
        return PEAK_HOURS.contains(LocalTime.now(VN_ZONE).getHour());
    }
}
