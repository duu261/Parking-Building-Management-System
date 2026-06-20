package com.parkmaster.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.Floor;
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.SessionStatus;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for PaymentService — repository mocked, no Spring context. */
class PaymentServiceTest {

    private static final String STAFF = "staff@x.com";

    private PaymentRepository payments;
    private com.parkmaster.user.UserRepository users;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        payments = Mockito.mock(PaymentRepository.class);
        users = Mockito.mock(com.parkmaster.user.UserRepository.class);
        when(payments.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        VnPayService vnPay = new VnPayService("TESTCODE", "TESTSECRETKEY1234567890",
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "http://localhost:5000/api/public/payments/vnpay-return");
        service = new PaymentService(payments, users, vnPay);
    }

    @Test
    void chargedSessionCreatesPendingPayment() {
        Payment p = service.createForSession(Mockito.mock(ParkingSession.class),
                new BigDecimal("12.00"));
        assertThat(p.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(p.getPaidAt()).isNull();
    }

    @Test
    void zeroChargeSessionAutoPaid() {
        Payment p = service.createForSession(Mockito.mock(ParkingSession.class), BigDecimal.ZERO);
        assertThat(p.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(p.getPaidAt()).isNotNull();
    }

    @Test
    void settleMarksPaidWithMethod() {
        Payment pending = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        when(payments.findById(1L)).thenReturn(Optional.of(pending));
        var resp = service.settle(1L, PaymentMethod.CASH, STAFF);
        assertThat(resp.status()).isEqualTo(PaymentStatus.PAID);
        assertThat(resp.method()).isEqualTo(PaymentMethod.CASH);
        assertThat(pending.getPaidAt()).isNotNull();
    }

    @Test
    void doubleSettleRejected() {
        Payment paid = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        paid.setStatus(PaymentStatus.PAID);
        when(payments.findById(1L)).thenReturn(Optional.of(paid));
        assertThatThrownBy(() -> service.settle(1L, PaymentMethod.CASH, STAFF))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void settleMissingPaymentThrows() {
        when(payments.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.settle(99L, PaymentMethod.CASH, STAFF))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void revenueRejectsInvertedRange() {
        Instant now = Instant.now();
        assertThatThrownBy(() -> service.revenue(now, now.minusSeconds(1)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void payOwnByOwnerSettlesOnline() {
        Payment payment = ownedPayment("driver@x.com");
        when(payments.findById(1L)).thenReturn(Optional.of(payment));

        PaymentDtos.PaymentResponse res = service.payOwn("driver@x.com", 1L);

        assertThat(res.status()).isEqualTo(PaymentStatus.PAID);
        assertThat(res.method()).isEqualTo(PaymentMethod.ONLINE);
    }

    @Test
    void payOwnByNonOwnerNotFound() {
        Payment payment = ownedPayment("driver@x.com");
        when(payments.findById(1L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> service.payOwn("intruder@x.com", 1L))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void voidPendingCancelsCharge() {
        Payment pending = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        when(payments.findById(1L)).thenReturn(Optional.of(pending));

        var res = service.voidPayment(1L, "wrong plate", STAFF);

        assertThat(res.status()).isEqualTo(PaymentStatus.VOIDED);
        assertThat(res.voidReason()).isEqualTo("wrong plate");
        assertThat(pending.getVoidedAt()).isNotNull();
    }

    @Test
    void voidPaidRefunds() {
        Payment paid = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        paid.setStatus(PaymentStatus.PAID);
        when(payments.findById(1L)).thenReturn(Optional.of(paid));

        var res = service.voidPayment(1L, "lost ticket overcharge", STAFF);

        assertThat(res.status()).isEqualTo(PaymentStatus.VOIDED);
    }

    @Test
    void doubleVoidRejected() {
        Payment voided = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        voided.setStatus(PaymentStatus.VOIDED);
        when(payments.findById(1L)).thenReturn(Optional.of(voided));

        assertThatThrownBy(() -> service.voidPayment(1L, "again", STAFF))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void settleReleasesSlotOfAwaitingSession() {
        ParkingSlot slot = occupiedSlot();
        Payment pending = awaitingPayment(slot);
        when(payments.findById(1L)).thenReturn(Optional.of(pending));

        service.settle(1L, PaymentMethod.CASH, STAFF);

        assertThat(pending.getSession().getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void voidReleasesSlotOfAwaitingSession() {
        ParkingSlot slot = occupiedSlot();
        Payment pending = awaitingPayment(slot);
        when(payments.findById(1L)).thenReturn(Optional.of(pending));

        service.voidPayment(1L, "waived", STAFF);

        assertThat(pending.getSession().getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void settleRecordsProcessingStaff() {
        Payment pending = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        when(payments.findById(1L)).thenReturn(Optional.of(pending));
        when(users.findByEmail(STAFF))
                .thenReturn(Optional.of(new User(STAFF, "h", "Sam Staff", Role.STAFF)));

        var resp = service.settle(1L, PaymentMethod.CASH, STAFF);

        assertThat(resp.processedByStaff()).isEqualTo("Sam Staff");
    }

    private ParkingSlot occupiedSlot() {
        ParkingSlot slot = new ParkingSlot(new Floor(new ParkingBuilding("B", null), 1, "P1"), "A1");
        slot.setStatus(SlotStatus.OCCUPIED);
        return slot;
    }

    private Payment awaitingPayment(ParkingSlot slot) {
        ParkingSession session =
                new ParkingSession(slot, new VehicleType("Car", null), "51A-123", false);
        session.setStatus(SessionStatus.AWAITING_PAYMENT);
        return new Payment(session, new BigDecimal("12.00"));
    }

    private Payment ownedPayment(String ownerEmail) {
        ParkingSession session = Mockito.mock(ParkingSession.class);
        when(session.getUser()).thenReturn(new User(ownerEmail, "h", "D", Role.USER));
        return new Payment(session, new BigDecimal("12.00"));
    }
}
