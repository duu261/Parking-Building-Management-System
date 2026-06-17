package com.parkmaster.session;

import com.parkmaster.session.SessionDtos.CheckInRequest;
import com.parkmaster.session.SessionDtos.SessionResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/sessions")
class StaffSessionController {

    private final ParkingSessionService service;

    StaffSessionController(ParkingSessionService service) {
        this.service = service;
    }

    @PostMapping("/check-in")
    ResponseEntity<SessionResponse> checkIn(@Valid @RequestBody CheckInRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.checkIn(req));
    }

    @PostMapping("/{id}/check-out")
    SessionResponse checkOut(@PathVariable Long id) {
        return service.checkOut(id);
    }

    @GetMapping("/active")
    List<SessionResponse> listActive() {
        return service.listActive();
    }

    @GetMapping("/{id}")
    SessionResponse get(@PathVariable Long id) {
        return service.get(id);
    }
}
