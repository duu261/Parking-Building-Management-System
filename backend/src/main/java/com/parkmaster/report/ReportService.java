package com.parkmaster.report;

import com.parkmaster.common.ApiException;
import com.parkmaster.payment.Payment;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.payment.PaymentStatus;
import com.parkmaster.report.ReportDtos.AllocationComparison;
import com.parkmaster.report.ReportDtos.DailyRevenuePoint;
import com.parkmaster.report.ReportDtos.DailyRevenueReport;
import com.parkmaster.report.ReportDtos.DurationByTypePoint;
import com.parkmaster.report.ReportDtos.DurationByTypeReport;
import com.parkmaster.report.ReportDtos.HourlyCheckInPoint;
import com.parkmaster.report.ReportDtos.HourlyCheckInReport;
import com.parkmaster.report.ReportDtos.RevenueByTypePoint;
import com.parkmaster.report.ReportDtos.RevenueByTypeReport;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manager analytics for charts. Aggregates payments and sessions in-memory over a time window.
 * ponytail: Java-side grouping (no native SQL) — fine at capstone data volume. If rows ever
 * outgrow memory, push these into native date_trunc/EXTRACT queries.
 * All day/hour bucketing is in UTC.
 */
@Service
public class ReportService {

    private static final int HOURS_PER_DAY = 24;

    private final PaymentRepository payments;
    private final ParkingSessionRepository sessions;

    public ReportService(PaymentRepository payments, ParkingSessionRepository sessions) {
        this.payments = payments;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public DailyRevenueReport revenueDaily(Instant from, Instant to) {
        List<Payment> paid = paidIn(from, to);

        Map<LocalDate, BigDecimal> totals = new TreeMap<>();
        Map<LocalDate, Long> counts = new TreeMap<>();
        for (Payment p : paid) {
            LocalDate day = p.getPaidAt().atZone(ZoneOffset.UTC).toLocalDate();
            totals.merge(day, p.getAmount(), BigDecimal::add);
            counts.merge(day, 1L, Long::sum);
        }

        List<DailyRevenuePoint> points = new ArrayList<>();
        LocalDate cursor = from.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate last = to.atZone(ZoneOffset.UTC).toLocalDate();
        while (!cursor.isAfter(last)) {
            points.add(new DailyRevenuePoint(cursor,
                    totals.getOrDefault(cursor, BigDecimal.ZERO),
                    counts.getOrDefault(cursor, 0L)));
            cursor = cursor.plusDays(1);
        }
        return new DailyRevenueReport(points);
    }

    @Transactional(readOnly = true)
    public RevenueByTypeReport revenueByVehicleType(Instant from, Instant to) {
        Map<String, BigDecimal> totals = new java.util.HashMap<>();
        Map<String, Long> counts = new java.util.HashMap<>();
        for (Payment p : paidIn(from, to)) {
            if (p.getSession() == null) continue;
            String type = p.getSession().getVehicleType().getName();
            totals.merge(type, p.getAmount(), BigDecimal::add);
            counts.merge(type, 1L, Long::sum);
        }
        List<RevenueByTypePoint> points = totals.entrySet().stream()
                .map(e -> new RevenueByTypePoint(e.getKey(), e.getValue(), counts.get(e.getKey())))
                .sorted(Comparator.comparing(RevenueByTypePoint::total).reversed())
                .toList();
        return new RevenueByTypeReport(points);
    }

    @Transactional(readOnly = true)
    public HourlyCheckInReport checkInsByHour(Instant from, Instant to) {
        long[] buckets = new long[HOURS_PER_DAY];
        for (ParkingSession s : startedIn(from, to)) {
            int hour = s.getCheckInAt().atZone(ZoneOffset.UTC).getHour();
            buckets[hour]++;
        }
        List<HourlyCheckInPoint> points = new ArrayList<>(HOURS_PER_DAY);
        for (int h = 0; h < HOURS_PER_DAY; h++) {
            points.add(new HourlyCheckInPoint(h, buckets[h]));
        }
        return new HourlyCheckInReport(points);
    }

    @Transactional(readOnly = true)
    public DurationByTypeReport durationByVehicleType(Instant from, Instant to) {
        Map<String, double[]> agg = new java.util.HashMap<>(); // [sumMinutes, count]
        for (ParkingSession s : startedIn(from, to)) {
            if (s.getCheckOutAt() == null) {
                continue;
            }
            String type = s.getVehicleType().getName();
            double[] acc = agg.computeIfAbsent(type, k -> new double[2]);
            acc[0] += minutes(s);
            acc[1] += 1;
        }
        List<DurationByTypePoint> points = agg.entrySet().stream()
                .map(e -> new DurationByTypePoint(e.getKey(),
                        e.getValue()[0] / e.getValue()[1], (long) e.getValue()[1]))
                .sorted(Comparator.comparing(DurationByTypePoint::vehicleType))
                .toList();
        return new DurationByTypeReport(points);
    }

    @Transactional(readOnly = true)
    public AllocationComparison allocationComparison(Instant from, Instant to) {
        double autoSum = 0;
        long autoCount = 0;
        double manualSum = 0;
        long manualCount = 0;
        for (ParkingSession s : startedIn(from, to)) {
            if (s.getCheckOutAt() == null) {
                continue;
            }
            double mins = minutes(s);
            if (s.isAutoAllocated()) {
                autoSum += mins;
                autoCount++;
            } else {
                manualSum += mins;
                manualCount++;
            }
        }
        return new AllocationComparison(
                autoCount, autoCount == 0 ? 0 : autoSum / autoCount,
                manualCount, manualCount == 0 ? 0 : manualSum / manualCount);
    }

    private List<Payment> paidIn(Instant from, Instant to) {
        validate(from, to);
        return payments.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
                PaymentStatus.PAID, from, to);
    }

    private List<ParkingSession> startedIn(Instant from, Instant to) {
        validate(from, to);
        return sessions.findByCheckInAtGreaterThanEqualAndCheckInAtLessThan(from, to);
    }

    private static double minutes(ParkingSession s) {
        return Duration.between(s.getCheckInAt(), s.getCheckOutAt()).toSeconds() / 60.0;
    }

    private static void validate(Instant from, Instant to) {
        if (from.isAfter(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "from must be before to");
        }
    }
}
