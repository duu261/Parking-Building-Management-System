package com.parkmaster.session;

import com.parkmaster.session.SessionDtos.SessionResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Driver self-service: track only your own sessions (ownership enforced in the service).
@RestController
@RequestMapping("/api/driver/sessions")
class DriverSessionController {

    private final ParkingSessionService service;

    DriverSessionController(ParkingSessionService service) {
        this.service = service;
    }

    @GetMapping
    List<SessionResponse> mine(Authentication auth) {
        return service.listForUser(auth.getName());
    }

    @GetMapping("/{id}")
    SessionResponse one(@PathVariable Long id, Authentication auth) {
        return service.getForUser(auth.getName(), id);
    }

    @GetMapping("/{id}/estimate")
    Map<String, BigDecimal> estimate(@PathVariable Long id, Authentication auth) {
        return Map.of("estimate", service.estimateChargeForUser(auth.getName(), id));
    }

    @GetMapping(value = "/{id}/ticket.png", produces = MediaType.IMAGE_PNG_VALUE)
    byte[] ticketQr(@PathVariable Long id, Authentication auth) {
        return service.ticketQrForUser(auth.getName(), id);
    }
}
