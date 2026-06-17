package com.parkmaster.session;

import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.pricing.VehicleType;
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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ponytail: session doubles as the ticket for now. Split out ParkingTicket only
// if a printable/QR artifact with its own lifecycle is needed.
@Entity
@Table(name = "parking_session")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParkingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_id", nullable = false)
    private ParkingSlot slot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_type_id", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "license_plate", nullable = false)
    private String licensePlate;

    @Column(name = "check_in_at", nullable = false, updatable = false)
    private Instant checkInAt = Instant.now();

    @Column(name = "check_out_at")
    private Instant checkOutAt;

    @Column(name = "amount_charged")
    private BigDecimal amountCharged;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "auto_allocated", nullable = false)
    private boolean autoAllocated = false;

    public ParkingSession(ParkingSlot slot, VehicleType vehicleType, String licensePlate,
            boolean autoAllocated) {
        this.slot = slot;
        this.vehicleType = vehicleType;
        this.licensePlate = licensePlate;
        this.autoAllocated = autoAllocated;
    }
}
