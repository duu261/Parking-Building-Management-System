package com.parkmaster.payment;

import com.parkmaster.session.ParkingSession;
import com.parkmaster.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ponytail: one payment per session (unique FK). No refund/void state until needed.
@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "session_id", unique = true)
    private ParkingSession session;

    /** Total charged = base parking fee + penalty. */
    @Column(nullable = false)
    private BigDecimal amount;

    /** Penalty component of the total (lost ticket, overtime, etc.); 0 if none. */
    @Column(name = "penalty_amount", nullable = false)
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    /** Staff member who settled or voided this at the booth; null for online pay. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_staff_id")
    private User processedByStaff;

    @Enumerated(EnumType.STRING)
    @Column
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "voided_at")
    private Instant voidedAt;

    @Column(name = "void_reason")
    private String voidReason;

    /** VNPay transaction reference we generated (vnp_TxnRef); unique per pay attempt. */
    @Column(name = "gateway_ref", unique = true)
    private String gatewayRef;

    /** VNPay's own transaction number (vnp_TransactionNo) returned on callback. */
    @Column(name = "gateway_txn_no")
    private String gatewayTxnNo;

    /** VNPay response code (vnp_ResponseCode); "00" means success. */
    @Column(name = "gateway_response_code")
    private String gatewayResponseCode;

    public Payment(ParkingSession session, BigDecimal amount) {
        this.session = session;
        this.amount = amount;
    }

    public Payment(BigDecimal amount) {
        this.amount = amount;
    }
}
