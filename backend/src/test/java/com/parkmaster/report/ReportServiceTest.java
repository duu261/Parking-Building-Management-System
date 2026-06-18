package com.parkmaster.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.payment.Payment;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.payment.PaymentStatus;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for ReportService — repositories mocked, aggregation verified in-memory. */
class ReportServiceTest {

    private static final Instant FROM = Instant.parse("2026-06-01T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-06-04T00:00:00Z"); // 3-day window

    private final VehicleType car = new VehicleType("Car", "4 wheels");
    private final VehicleType bike = new VehicleType("Bike", "2 wheels");

    private PaymentRepository payments;
    private ParkingSessionRepository sessions;
    private ReportService service;

    @BeforeEach
    void setUp() {
        payments = Mockito.mock(PaymentRepository.class);
        sessions = Mockito.mock(ParkingSessionRepository.class);
        service = new ReportService(payments, sessions);
    }

    private Payment paidPayment(VehicleType type, String amount, Instant paidAt) {
        ParkingSession session = new ParkingSession(null, type, "51A-12345", false);
        Payment p = new Payment(session, new BigDecimal(amount));
        p.setStatus(PaymentStatus.PAID);
        p.setPaidAt(paidAt);
        return p;
    }

    private ParkingSession session(VehicleType type, Instant in, Instant out, boolean auto) {
        ParkingSession s = new ParkingSession(null, type, "51A-12345", auto);
        s.setCheckInAt(in);
        s.setCheckOutAt(out);
        return s;
    }

    private void mockPaid(Payment... ps) {
        when(payments.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
                PaymentStatus.PAID, FROM, TO)).thenReturn(List.of(ps));
    }

    private void mockSessions(ParkingSession... ss) {
        when(sessions.findByCheckInAtGreaterThanEqualAndCheckInAtLessThan(FROM, TO))
                .thenReturn(List.of(ss));
    }

    @Test
    void revenueDaily_zeroFillsEveryDayAndSumsPerDay() {
        mockPaid(
                paidPayment(car, "10.00", Instant.parse("2026-06-01T09:00:00Z")),
                paidPayment(car, "5.00", Instant.parse("2026-06-01T18:00:00Z")),
                paidPayment(bike, "2.00", Instant.parse("2026-06-03T08:00:00Z")));

        var points = service.revenueDaily(FROM, TO).points();

        assertThat(points).hasSize(4); // Jun 1..4 inclusive
        assertThat(points.get(0).total()).isEqualByComparingTo("15.00");
        assertThat(points.get(0).count()).isEqualTo(2);
        assertThat(points.get(1).total()).isEqualByComparingTo("0"); // zero-filled gap
        assertThat(points.get(2).total()).isEqualByComparingTo("2.00");
    }

    @Test
    void revenueByVehicleType_groupsAndSortsByTotalDesc() {
        mockPaid(
                paidPayment(bike, "2.00", FROM),
                paidPayment(car, "10.00", FROM),
                paidPayment(car, "5.00", FROM));

        var points = service.revenueByVehicleType(FROM, TO).points();

        assertThat(points).hasSize(2);
        assertThat(points.get(0).vehicleType()).isEqualTo("Car");
        assertThat(points.get(0).total()).isEqualByComparingTo("15.00");
        assertThat(points.get(1).vehicleType()).isEqualTo("Bike");
    }

    @Test
    void checkInsByHour_returns24BucketsAndCounts() {
        mockSessions(
                session(car, Instant.parse("2026-06-01T09:15:00Z"), null, false),
                session(bike, Instant.parse("2026-06-02T09:45:00Z"), null, false),
                session(car, Instant.parse("2026-06-03T17:00:00Z"), null, false));

        var points = service.checkInsByHour(FROM, TO).points();

        assertThat(points).hasSize(24);
        assertThat(points.get(9).count()).isEqualTo(2);
        assertThat(points.get(17).count()).isEqualTo(1);
        assertThat(points.get(0).count()).isZero();
    }

    @Test
    void durationByVehicleType_averagesClosedSessionsOnly() {
        mockSessions(
                session(car, Instant.parse("2026-06-01T09:00:00Z"),
                        Instant.parse("2026-06-01T10:00:00Z"), false), // 60 min
                session(car, Instant.parse("2026-06-01T09:00:00Z"),
                        Instant.parse("2026-06-01T11:00:00Z"), false), // 120 min
                session(car, Instant.parse("2026-06-02T09:00:00Z"), null, false)); // open, ignored

        var points = service.durationByVehicleType(FROM, TO).points();

        assertThat(points).hasSize(1);
        assertThat(points.get(0).vehicleType()).isEqualTo("Car");
        assertThat(points.get(0).avgMinutes()).isEqualTo(90.0);
        assertThat(points.get(0).count()).isEqualTo(2);
    }

    @Test
    void allocationComparison_splitsAutoAndManual() {
        mockSessions(
                session(car, Instant.parse("2026-06-01T09:00:00Z"),
                        Instant.parse("2026-06-01T09:30:00Z"), true), // auto 30 min
                session(car, Instant.parse("2026-06-01T09:00:00Z"),
                        Instant.parse("2026-06-01T10:00:00Z"), false)); // manual 60 min

        var c = service.allocationComparison(FROM, TO);

        assertThat(c.autoCount()).isEqualTo(1);
        assertThat(c.autoAvgMinutes()).isEqualTo(30.0);
        assertThat(c.manualCount()).isEqualTo(1);
        assertThat(c.manualAvgMinutes()).isEqualTo(60.0);
    }

    @Test
    void rejectsInvertedWindow() {
        assertThatThrownBy(() -> service.revenueDaily(TO, FROM))
                .isInstanceOf(ApiException.class);
    }
}
