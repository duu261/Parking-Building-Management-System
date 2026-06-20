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
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentRepository payments;
    private final UserRepository users;
    private final VnPayService vnPay;

    public PaymentService(PaymentRepository payments, UserRepository users, VnPayService vnPay) {
        this.payments = payments;
        this.users = users;
        this.vnPay = vnPay;
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

    /** Driver pays their own session online (mock-confirmed). Ownership enforced; non-owner 404. */
    @Transactional
    public PaymentResponse payOwn(String email, Long id) {
        Payment payment = ownedPayment(email, id);
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already settled");
        }
        payment.setMethod(PaymentMethod.ONLINE);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        completeCheckedOutSession(payment);
        return PaymentResponse.from(payment);
    }

    /**
     * Begin a VNPay payment for the driver's own pending payment. Generates a unique gateway ref,
     * stores it, and returns the hosted-checkout URL to redirect to. Ownership enforced (404).
     */
    @Transactional
    public String startVnPay(String email, Long id, String clientIp) {
        Payment payment = ownedPayment(email, id);
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment already settled");
        }
        if (payment.getStatus() == PaymentStatus.VOIDED) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment was voided");
        }
        String txnRef = id + "_" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(ZonedDateTime.now(VN_ZONE));
        payment.setGatewayRef(txnRef);
        payment.setMethod(PaymentMethod.VNPAY);
        payments.save(payment);
        return vnPay.buildPaymentUrl(txnRef, amountVnd(payment),
                "Thanh toan ve gui xe #" + id, clientIp);
    }

    /**
     * Handle a verified VNPay return/callback. Idempotent: marks the matched payment PAID on a
     * successful, amount-matching, signature-valid response; otherwise records the outcome only.
     */
    @Transactional
    public VnPayResult handleVnPayReturn(Map<String, String> params) {
        if (!vnPay.isValidSignature(params)) {
            return VnPayResult.INVALID_SIGNATURE;
        }
        Payment payment = payments.findByGatewayRef(params.get("vnp_TxnRef")).orElse(null);
        if (payment == null) {
            return VnPayResult.NOT_FOUND;
        }
        payment.setGatewayResponseCode(params.get("vnp_ResponseCode"));
        payment.setGatewayTxnNo(params.get("vnp_TransactionNo"));

        boolean ok = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
        if (!ok) {
            return VnPayResult.FAILED;
        }
        if (Long.parseLong(params.get("vnp_Amount")) != amountVnd(payment) * 100) {
            return VnPayResult.AMOUNT_MISMATCH;
        }
        if (payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
            completeCheckedOutSession(payment);
        }
        return VnPayResult.SUCCESS;
    }

    /** Resolve a payment owned by the given driver, else 404 (no ownership leak). */
    private Payment ownedPayment(String email, Long id) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        var owner = payment.getSession().getUser();
        if (owner == null || !owner.getEmail().equals(email)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        return payment;
    }

    /** Whole-đồng VND amount for the gateway (VNPay multiplies by 100 itself). */
    private static long amountVnd(Payment payment) {
        return payment.getAmount().setScale(0, RoundingMode.HALF_UP).longValueExact();
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
