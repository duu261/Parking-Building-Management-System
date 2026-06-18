package com.parkmaster.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Graph-ready report payloads. Every list is a chart series the frontend can plot directly. */
public final class ReportDtos {

    private ReportDtos() {}

    /** Revenue per calendar day (UTC), zero-filled across the range. Bar or line chart. */
    public record DailyRevenuePoint(LocalDate date, BigDecimal total, long count) {}

    /** Revenue split by vehicle type. Pie or bar chart. */
    public record RevenueByTypePoint(String vehicleType, BigDecimal total, long count) {}

    /** Check-in count per hour of day (0-23), zero-filled. Bar chart for peak-hour (RQ4). */
    public record HourlyCheckInPoint(int hour, long count) {}

    /** Average parked duration by vehicle type. Bar chart. */
    public record DurationByTypePoint(String vehicleType, double avgMinutes, long count) {}

    /** Auto-allocated vs manual: count and average duration. Comparison bars (RQ2). */
    public record AllocationComparison(
            long autoCount, double autoAvgMinutes, long manualCount, double manualAvgMinutes) {}

    public record DailyRevenueReport(List<DailyRevenuePoint> points) {}

    public record RevenueByTypeReport(List<RevenueByTypePoint> points) {}

    public record HourlyCheckInReport(List<HourlyCheckInPoint> points) {}

    public record DurationByTypeReport(List<DurationByTypePoint> points) {}
}
