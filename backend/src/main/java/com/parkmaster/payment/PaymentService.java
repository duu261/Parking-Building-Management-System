package com.parkmaster.payment;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import com.parkmaster.payment.PaymentDtos.RevenueResponse;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.SessionStatus;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final UserRepository users;

    public PaymentService(PaymentRepository payments, UserRepository users) {
        this.payments = payments;
        this.users = users;
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
    public PaymentResponse settle(Long id, PaymentMethod method, String staffEmail) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already settled");
        }
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        payment.setProcessedByStaff(staff(staffEmail));
        completeCheckedOutSession(payment);
        return PaymentResponse.from(payment);
    }

    /** Staff voids a charge: cancels a PENDING one or refunds a PAID one. Reason required. */
    @Transactional
    public PaymentResponse voidPayment(Long id, String reason, String staffEmail) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (payment.getStatus() == PaymentStatus.VOIDED) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already voided");
        }
        payment.setStatus(PaymentStatus.VOIDED);
        payment.setVoidedAt(Instant.now());
        payment.setVoidReason(reason);
        payment.setProcessedByStaff(staff(staffEmail));
        // Charge waived: the car still leaves, so release its slot too.
        completeCheckedOutSession(payment);
        return PaymentResponse.from(payment);
    }

    /** Resolve the acting staff member; null email (e.g. system) leaves it unset. */
    private User staff(String email) {
        if (email == null) {
            return null;
        }
        return users.findByEmail(email).orElse(null);
    }

    /**
     * Once a checked-out session's charge is resolved (settled, paid, or voided),
     * complete the session and free its slot. No-op for sessions in any other
     * state, so refunding an already-completed session leaves its slot untouched.
     */
    private void completeCheckedOutSession(Payment payment) {
        ParkingSession session = payment.getSession();
        if (session != null && session.getStatus() == SessionStatus.AWAITING_PAYMENT) {
            session.setStatus(SessionStatus.COMPLETED);
            session.getSlot().setStatus(SlotStatus.AVAILABLE);
        }
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
        completeCheckedOutSession(payment);
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
