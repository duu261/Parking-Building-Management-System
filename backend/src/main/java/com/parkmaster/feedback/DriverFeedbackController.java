package com.parkmaster.feedback;

import com.parkmaster.feedback.FeedbackDtos.CreateRequest;
import com.parkmaster.feedback.FeedbackDtos.FeedbackResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/feedback")
class DriverFeedbackController {

    private final FeedbackService service;

    DriverFeedbackController(FeedbackService service) {
        this.service = service;
    }

    @PostMapping
    FeedbackResponse submit(@RequestBody CreateRequest req, Authentication auth) {
        return service.submit(auth.getName(), req);
    }

    @GetMapping
    List<FeedbackResponse> mine(Authentication auth) {
        return service.myFeedback(auth.getName());
    }
}
