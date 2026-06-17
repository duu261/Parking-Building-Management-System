package com.parkmaster.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class PeakHoursTest {

    // VN is UTC+7: 00:00Z == 07:00 VN.
    @Test
    void morningPeakStartIsOn() {
        assertThat(PeakHours.isPeak(Instant.parse("2026-06-17T00:00:00Z"))).isTrue(); // 07:00 VN
    }

    @Test
    void justBeforePeakIsOff() {
        assertThat(PeakHours.isPeak(Instant.parse("2026-06-16T23:59:00Z"))).isFalse(); // 06:59 VN
    }

    @Test
    void afterMorningPeakIsOff() {
        assertThat(PeakHours.isPeak(Instant.parse("2026-06-17T02:00:00Z"))).isFalse(); // 09:00 VN
    }

    @Test
    void eveningPeakIsOn() {
        assertThat(PeakHours.isPeak(Instant.parse("2026-06-17T10:00:00Z"))).isTrue(); // 17:00 VN
    }
}
