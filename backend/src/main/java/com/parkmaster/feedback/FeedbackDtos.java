package com.parkmaster.feedback;

import java.time.Instant;

final class FeedbackDtos {

    private FeedbackDtos() {}

    record CreateRequest(Long sessionId, short rating, String comment) {}

    record FeedbackResponse(Long id, Long sessionId, String licensePlate, String driverName,
            short rating, String comment, Instant createdAt) {

        static FeedbackResponse from(Feedback f) {
            return new FeedbackResponse(
                    f.getId(),
                    f.getSession().getId(),
                    f.getSession().getLicensePlate(),
                    f.getUser() != null ? f.getUser().getFullName() : null,
                    f.getRating(),
                    f.getComment(),
                    f.getCreatedAt());
        }
    }
}
