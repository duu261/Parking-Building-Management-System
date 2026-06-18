package com.parkmaster.payment;

import com.parkmaster.common.ApiException;
import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import com.parkmaster.payment.PaymentDtos.RevenueResponse;
import com.parkmaster.session.ParkingSession;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository payments;

    public PaymentService(PaymentRepository payments) {
        this.payments = payments;
    }

    /** Called at check-out. Zero-charge exits are auto-settled; otherwise PENDING. */
    @Transactional
    public Payment createForSession(ParkingSession session, BigDecimal amount) {
        Payment payment = new Payment(session, amount);
        if (amount.signum() == 0) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
        }
        return payments.save(payment);
    }

    @Transactional
    public PaymentResponse settle(Long id, PaymentMethod method) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already settled");
        }
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        return PaymentResponse.from(payment);
    }

    /** Staff voids a charge: cancels a PENDING one or refunds a PAID one. Reason required. */
    @Transactional
    public PaymentResponse voidPayment(Long id, String reason) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (payment.getStatus() == PaymentStatus.VOIDED) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already voided");
        }
        payment.setStatus(PaymentStatus.VOIDED);
        payment.setVoidedAt(Instant.now());
        payment.setVoidReason(reason);
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPending() {
        return payments.findByStatusOrderByCreatedAt(PaymentStatus.PENDING).stream()
                .map(PaymentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse get(Long id) {
        return PaymentResponse.from(payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found")));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listForUser(String email) {
        return payments.findBySession_User_EmailOrderByCreatedAtDesc(email).stream()
                .map(PaymentResponse::from).toList();
    }

    /** Driver pays their own session online. Ownership enforced; non-owner gets 404. */
    @Transactional
    public PaymentResponse payOwn(String email, Long id) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        var owner = payment.getSession().getUser();
        if (owner == null || !owner.getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already settled");
        }
        payment.setMethod(PaymentMethod.ONLINE);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public RevenueResponse revenue(Instant from, Instant to) {
        if (from.isAfter(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "from must be before to");
        }
        BigDecimal total = payments.sumPaidBetween(from, to);
        long count = payments.countPaidBetween(from, to);
        return new RevenueResponse(from, to, total, count);
    }
}
