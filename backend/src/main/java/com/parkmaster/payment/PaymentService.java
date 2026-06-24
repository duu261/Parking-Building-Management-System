package com.parkmaster.payment;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pass.MonthlyPass;
import com.parkmaster.pass.MonthlyPassRepository;
import com.parkmaster.pass.MonthlyPassService;
import com.parkmaster.pass.PassStatus;
import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import com.parkmaster.payment.PaymentDtos.RevenueResponse;
import com.parkmaster.reservation.Reservation;
import com.parkmaster.reservation.ReservationRepository;
import com.parkmaster.reservation.ReservationStatus;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.SessionStatus;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
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
    private final MonthlyPassService passService;
    private final MonthlyPassRepository passRepo;
    private final ReservationRepository reservationRepo;

    public PaymentService(PaymentRepository payments, UserRepository users, VnPayService vnPay,
            MonthlyPassService passService, MonthlyPassRepository passRepo,
            ReservationRepository reservationRepo) {
        this.payments = payments;
        this.users = users;
        this.vnPay = vnPay;
        this.passService = passService;
        this.passRepo = passRepo;
        this.reservationRepo = reservationRepo;
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
        activateLinkedPass(payment);
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
        completeCheckedOutSession(payment);
        cancelLinkedReservation(payment);
        cancelLinkedPass(payment);
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<Long> paymentIdForSession(Long sessionId) {
        return payments.findBySessionId(sessionId).map(Payment::getId);
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
    private void activateLinkedPass(Payment payment) {
        passService.activatePass(payment);
    }

    private void completeCheckedOutSession(Payment payment) {
        ParkingSession session = payment.getSession();
        if (session != null && session.getStatus() == SessionStatus.AWAITING_PAYMENT) {
            session.setStatus(SessionStatus.COMPLETED);
            session.getSlot().setStatus(SlotStatus.AVAILABLE);
        }
    }

    private void cancelLinkedReservation(Payment payment) {
        reservationRepo.findByDepositPaymentId(payment.getId()).ifPresent(r -> {
            if (r.getStatus() == ReservationStatus.PENDING) {
                r.setStatus(ReservationStatus.CANCELLED);
                if (r.getSlot() != null) {
                    r.getSlot().setStatus(SlotStatus.AVAILABLE);
                }
            }
        });
    }

    private String resolveRedirectPage(Payment payment) {
        if (payment.getSession() != null) return "/sessions";
        if (reservationRepo.findByDepositPaymentId(payment.getId()).isPresent()) return "/reservations";
        return "/my-passes";
    }

    private void confirmLinkedReservation(Payment payment) {
        reservationRepo.findByDepositPaymentId(payment.getId()).ifPresent(r -> {
            if (r.getStatus() == ReservationStatus.PENDING && r.getReservedStart() != null) {
                r.setHoldUntil(r.getReservedStart().plus(Duration.ofMinutes(30)));
            }
        });
    }

    private void cancelLinkedPass(Payment payment) {
        passRepo.findByPayment_Id(payment.getId()).ifPresent(p -> {
            if (p.getStatus() == PassStatus.PENDING) {
                p.setStatus(PassStatus.EXPIRED);
            }
        });
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
        List<Payment> sessionPayments = payments.findBySession_User_EmailOrderByCreatedAtDesc(email);
        List<Long> passPaymentIds = passRepo.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .filter(p -> p.getPayment() != null).map(p -> p.getPayment().getId()).toList();
        List<Payment> passPayments = passPaymentIds.isEmpty() ? List.of()
                : payments.findAllById(passPaymentIds);
        return java.util.stream.Stream.concat(sessionPayments.stream(), passPayments.stream())
                .sorted(java.util.Comparator.comparing(Payment::getCreatedAt).reversed())
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
        activateLinkedPass(payment);
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
    public VnPayResult.Outcome handleVnPayReturn(Map<String, String> params) {
        if (!vnPay.isValidSignature(params)) {
            return new VnPayResult.Outcome(VnPayResult.INVALID_SIGNATURE, "/sessions");
        }
        Payment payment = payments.findByGatewayRef(params.get("vnp_TxnRef")).orElse(null);
        if (payment == null) {
            return new VnPayResult.Outcome(VnPayResult.NOT_FOUND, "/sessions");
        }
        String page = resolveRedirectPage(payment);
        payment.setGatewayResponseCode(params.get("vnp_ResponseCode"));
        payment.setGatewayTxnNo(params.get("vnp_TransactionNo"));

        boolean ok = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
        if (!ok) {
            return new VnPayResult.Outcome(VnPayResult.FAILED, page);
        }
        if (Long.parseLong(params.get("vnp_Amount")) != amountVnd(payment) * 100) {
            return new VnPayResult.Outcome(VnPayResult.AMOUNT_MISMATCH, page);
        }
        if (payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
            completeCheckedOutSession(payment);
            activateLinkedPass(payment);
            confirmLinkedReservation(payment);
        }
        return new VnPayResult.Outcome(VnPayResult.SUCCESS, page);
    }

    /** Resolve a payment owned by the given driver, else 404 (no ownership leak). */
    private Payment ownedPayment(String email, Long id) {
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        String ownerEmail = null;
        if (payment.getSession() != null) {
            User owner = payment.getSession().getUser();
            if (owner != null) ownerEmail = owner.getEmail();
        } else {
            ownerEmail = passRepo.findByPayment_Id(id)
                    .map(p -> p.getUser().getEmail()).orElse(null);
        }
        if (ownerEmail == null || !ownerEmail.equals(email)) {
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
