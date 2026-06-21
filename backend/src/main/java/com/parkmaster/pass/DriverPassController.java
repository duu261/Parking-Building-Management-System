package com.parkmaster.pass;

import com.parkmaster.pass.PassDtos.IssueRequest;
import com.parkmaster.pass.PassDtos.PassResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/passes")
class DriverPassController {

    private final MonthlyPassRepository passes;
    private final MonthlyPassService service;

    DriverPassController(MonthlyPassRepository passes, MonthlyPassService service) {
        this.passes = passes;
        this.service = service;
    }

    @Transactional(readOnly = true)
    @GetMapping
    List<PassResponse> mine(Authentication auth) {
        return passes.findByUser_EmailOrderByCreatedAtDesc(auth.getName()).stream()
                .map(PassResponse::from).toList();
    }

    @PostMapping
    PassResponse register(@RequestBody DriverPassRequest req, Authentication auth) {
        return service.issue(new IssueRequest(
                auth.getName(), req.vehicleTypeId(), req.licensePlate(),
                req.validFrom(), req.validUntil()));
    }

    record DriverPassRequest(
            @NotNull Long vehicleTypeId,
            @NotBlank String licensePlate,
            @NotNull LocalDate validFrom,
            @NotNull LocalDate validUntil) {}
}
