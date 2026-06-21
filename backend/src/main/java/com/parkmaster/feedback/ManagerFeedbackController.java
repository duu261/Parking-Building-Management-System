package com.parkmaster.feedback;

import com.parkmaster.feedback.FeedbackDtos.FeedbackResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/feedback")
class ManagerFeedbackController {

    private final FeedbackService service;

    ManagerFeedbackController(FeedbackService service) {
        this.service = service;
    }

    @GetMapping
    List<FeedbackResponse> all() {
        return service.all();
    }
}
