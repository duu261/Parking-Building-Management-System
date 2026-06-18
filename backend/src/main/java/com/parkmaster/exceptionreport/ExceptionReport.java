package com.parkmaster.exceptionreport;

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
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ponytail: session is nullable — a lost ticket may have no findable session yet.
// No assignment/severity fields until staff workflow needs them.
@Entity
@Table(name = "exception_report")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExceptionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ParkingSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExceptionType type;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExceptionStatus status = ExceptionStatus.OPEN;

    @Column(name = "resolution_note", columnDefinition = "text")
    private String resolutionNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public ExceptionReport(User reportedBy, ExceptionType type, String description,
            ParkingSession session) {
        this.reportedBy = reportedBy;
        this.type = type;
        this.description = description;
        this.session = session;
    }
}
