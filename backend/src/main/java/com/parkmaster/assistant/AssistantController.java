package com.parkmaster.assistant;

import com.parkmaster.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public chat endpoint (usable landing -> login, no auth). Rate-limited per IP to
// protect the free Gemini quota and basic abuse.
@RestController
@RequestMapping("/api/public/assistant")
class AssistantController {

    private static final int MAX_PER_MINUTE = 15;

    private final AssistantService assistant;
    // ponytail: in-memory per-IP limiter, single instance only. Swap for Redis/bucket4j if scaled out.
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    @PostMapping("/chat")
    AssistantDtos.ChatResponse chat(@Valid @RequestBody AssistantDtos.ChatRequest req,
            HttpServletRequest http) {
        rateLimit(clientIp(http));
        return assistant.chat(req);
    }

    private void rateLimit(String ip) {
        var now = Instant.now();
        var window = windows.compute(ip, (key, current) ->
                (current == null || current.start().isBefore(now.minus(Duration.ofMinutes(1))))
                        ? new Window(now, new AtomicInteger(0))
                        : current);
        if (window.count().incrementAndGet() > MAX_PER_MINUTE) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests. Please slow down and try again shortly.");
        }
    }

    private String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return http.getRemoteAddr();
    }

    private record Window(Instant start, AtomicInteger count) {}
}
