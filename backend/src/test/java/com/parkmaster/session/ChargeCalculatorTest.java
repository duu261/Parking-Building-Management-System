package com.parkmaster.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ChargeCalculatorTest {

    private static final Instant IN = Instant.parse("2026-06-17T08:00:00Z");
    private static final BigDecimal RATE = new BigDecimal("3.00");

    private static BigDecimal charge(long minutes, BigDecimal cap, int grace) {
        return ChargeCalculator.charge(IN, IN.plus(Duration.ofMinutes(minutes)), RATE, cap, grace,
                BigDecimal.ONE);
    }

    @Test
    void withinGraceIsFree() {
        assertThat(charge(10, null, 15)).isEqualByComparingTo("0");
    }

    @Test
    void oneHourBilledOnce() {
        assertThat(charge(60, null, 0)).isEqualByComparingTo("3.00");
    }

    @Test
    void partialHourRoundsUp() {
        assertThat(charge(61, null, 0)).isEqualByComparingTo("6.00");
    }

    @Test
    void graceSubtractedBeforeBilling() {
        // 90 - 15 = 75 billable minutes -> 2 started hours
        assertThat(charge(90, null, 15)).isEqualByComparingTo("6.00");
    }

    @Test
    void dailyCapAppliedWithinOneDay() {
        // 10h * 3 = 30, capped at 20
        assertThat(charge(600, new BigDecimal("20.00"), 0)).isEqualByComparingTo("20.00");
    }

    @Test
    void dailyCapScalesPerStartedDay() {
        // 25h -> 75 raw, spans 2 days -> cap 40
        assertThat(charge(1500, new BigDecimal("20.00"), 0)).isEqualByComparingTo("40.00");
    }

    @Test
    void peakMultiplierAppliedAfterCap() {
        // 10h * 3 = 30, capped at 20, then * 1.5 = 30
        assertThat(ChargeCalculator.charge(IN, IN.plus(Duration.ofMinutes(600)), RATE,
                new BigDecimal("20.00"), 0, new BigDecimal("1.5"))).isEqualByComparingTo("30.00");
    }
}
