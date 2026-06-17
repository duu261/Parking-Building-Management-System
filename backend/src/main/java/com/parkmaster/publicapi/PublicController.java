package com.parkmaster.publicapi;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
class PublicController {

    @GetMapping("/health")
    Map<String, Object> health() {
        return Map.of("status", "UP", "service", "parkmaster-api", "time", Instant.now().toString());
    }
}
