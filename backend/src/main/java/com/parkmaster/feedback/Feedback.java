package com.parkmaster.feedback;

import com.parkmaster.session.ParkingSession;
import com.parkmaster.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private ParkingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private short rating;

    @Column(length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Feedback() {}

    public Feedback(ParkingSession session, User user, short rating, String comment) {
        this.session = session;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() { return id; }
    public ParkingSession getSession() { return session; }
    public User getUser() { return user; }
    public short getRating() { return rating; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
}
