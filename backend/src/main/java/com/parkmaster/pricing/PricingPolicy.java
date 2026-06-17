package com.parkmaster.pricing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ponytail: one active policy per vehicle type (unique FK). Add time-windowed /
// effective-date pricing rows if peak-hour tariffs are needed for RQ4.
@Entity
@Table(name = "pricing_policy")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PricingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_type_id", nullable = false, unique = true)
    private VehicleType vehicleType;

    @Column(name = "rate_per_hour", nullable = false)
    private BigDecimal ratePerHour;

    /** Optional cap on a single day's charge; null = uncapped. */
    @Column(name = "daily_cap")
    private BigDecimal dailyCap;

    /** Free minutes before billing starts. */
    @Column(name = "grace_minutes", nullable = false)
    private int graceMinutes = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PricingPolicy(VehicleType vehicleType, BigDecimal ratePerHour, BigDecimal dailyCap,
            int graceMinutes) {
        this.vehicleType = vehicleType;
        this.ratePerHour = ratePerHour;
        this.dailyCap = dailyCap;
        this.graceMinutes = graceMinutes;
    }
}
