package com.parkmaster.session;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

/**
 * Pure parking-charge math, isolated from persistence so it can be unit-tested
 * directly. Billed per started hour after a grace window, optionally capped per
 * started day.
 */
final class ChargeCalculator {

    private static final int MINUTES_PER_HOUR = 60;
    private static final int MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

    private ChargeCalculator() {}

    static BigDecimal charge(Instant checkIn, Instant checkOut, BigDecimal ratePerHour,
            BigDecimal dailyCap, int graceMinutes) {
        long totalMinutes = Duration.between(checkIn, checkOut).toMinutes();
        long billable = totalMinutes - graceMinutes;
        if (billable <= 0) {
            return BigDecimal.ZERO;
        }
        long hours = ceilDiv(billable, MINUTES_PER_HOUR);
        BigDecimal amount = ratePerHour.multiply(BigDecimal.valueOf(hours));
        if (dailyCap != null) {
            long days = ceilDiv(totalMinutes, MINUTES_PER_DAY);
            BigDecimal cap = dailyCap.multiply(BigDecimal.valueOf(Math.max(1, days)));
            if (amount.compareTo(cap) > 0) {
                amount = cap;
            }
        }
        return amount;
    }

    private static long ceilDiv(long a, long b) {
        return (a + b - 1) / b;
    }
}
