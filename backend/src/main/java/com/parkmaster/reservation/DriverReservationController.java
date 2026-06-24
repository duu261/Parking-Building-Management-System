package com.parkmaster.reservation;

import com.parkmaster.reservation.ReservationDtos.CreateReservationRequest;
import com.parkmaster.reservation.ReservationDtos.ReservationResponse;
import com.parkmaster.reservation.ReservationDtos.SlotSuggestion;
import com.parkmaster.session.QrCodeGenerator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver/reservations")
class DriverReservationController {

    private final ReservationService service;

    DriverReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<?> create(@Valid @RequestBody CreateReservationRequest req,
            Authentication auth, HttpServletRequest httpReq) {
        if (req.reservationType() == ReservationType.PAID) {
            var result = service.createPaid(auth.getName(), req, httpReq.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "reservation", result.reservation(),
                    "vnpayUrl", result.vnpayUrl(),
                    "depositAmount", result.depositAmount()));
        }
        ReservationResponse created = service.createFree(auth.getName(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("reservation", created));
    }

    @GetMapping
    List<ReservationResponse> mine(Authentication auth) {
        return service.listForUser(auth.getName());
    }

    @GetMapping("/suggest")
    List<SlotSuggestion> suggest(@RequestParam Long buildingId, @RequestParam Long vehicleTypeId) {
        return service.suggestSlots(buildingId, vehicleTypeId);
    }

    @PostMapping("/{id}/cancel")
    ResponseEntity<Void> cancel(@PathVariable Long id, Authentication auth) {
        service.cancel(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/qr.png", produces = MediaType.IMAGE_PNG_VALUE)
    byte[] qr(@PathVariable Long id) {
        return QrCodeGenerator.pngFor("RES:" + id);
    }
}
