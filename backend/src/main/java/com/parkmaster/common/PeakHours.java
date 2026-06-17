package com.parkmaster.common;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Set;

/** Shared peak-hour definition used by slot allocation and pricing (RQ4). */
public final class PeakHours {

    // VN local time: 7-9 AM and 5-7 PM.
    private static final Set<Integer> PEAK_HOURS = Set.of(7, 8, 17, 18);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private PeakHours() {}

    public static boolean isPeak(Instant instant) {
        return PEAK_HOURS.contains(instant.atZone(VN_ZONE).getHour());
    }

    public static boolean isPeakNow() {
        return isPeak(Instant.now());
    }
}
