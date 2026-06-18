package com.parkmaster.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.session.ParkingSession;
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

    private PaymentRepository payments;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        payments = Mockito.mock(PaymentRepository.class);
        when(payments.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new PaymentService(payments);
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
        var resp = service.settle(1L, PaymentMethod.CASH);
        assertThat(resp.status()).isEqualTo(PaymentStatus.PAID);
        assertThat(resp.method()).isEqualTo(PaymentMethod.CASH);
        assertThat(pending.getPaidAt()).isNotNull();
    }

    @Test
    void doubleSettleRejected() {
        Payment paid = new Payment(Mockito.mock(ParkingSession.class), new BigDecimal("12.00"));
        paid.setStatus(PaymentStatus.PAID);
        when(payments.findById(1L)).thenReturn(Optional.of(paid));
        assertThatThrownBy(() -> service.settle(1L, PaymentMethod.CASH))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void settleMissingPaymentThrows() {
        when(payments.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.settle(99L, PaymentMethod.CASH))
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

    private Payment ownedPayment(String ownerEmail) {
        ParkingSession session = Mockito.mock(ParkingSession.class);
        when(session.getUser()).thenReturn(new User(ownerEmail, "h", "D", Role.USER));
        return new Payment(session, new BigDecimal("12.00"));
    }
}
