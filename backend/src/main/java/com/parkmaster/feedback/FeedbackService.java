package com.parkmaster.feedback;

import com.parkmaster.common.ApiException;
import com.parkmaster.feedback.FeedbackDtos.CreateRequest;
import com.parkmaster.feedback.FeedbackDtos.FeedbackResponse;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import com.parkmaster.session.SessionStatus;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class FeedbackService {

    private final FeedbackRepository feedbackRepo;
    private final ParkingSessionRepository sessionRepo;
    private final UserRepository userRepo;

    FeedbackService(FeedbackRepository feedbackRepo, ParkingSessionRepository sessionRepo,
            UserRepository userRepo) {
        this.feedbackRepo = feedbackRepo;
        this.sessionRepo = sessionRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    FeedbackResponse submit(String email, CreateRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        ParkingSession session = sessionRepo.findById(req.sessionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));

        if (session.getUser() == null || !session.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your session");
        }
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Session not completed yet");
        }
        if (feedbackRepo.existsBySessionId(req.sessionId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Feedback already submitted for this session");
        }
        if (req.rating() < 1 || req.rating() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rating must be 1-5");
        }

        Feedback fb = new Feedback(session, user, req.rating(),
                req.comment() != null ? req.comment().trim() : null);
        return FeedbackResponse.from(feedbackRepo.save(fb));
    }

    @Transactional(readOnly = true)
    List<FeedbackResponse> myFeedback(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return feedbackRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(FeedbackResponse::from).toList();
    }

    @Transactional(readOnly = true)
    List<FeedbackResponse> all() {
        return feedbackRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(FeedbackResponse::from).toList();
    }
}
