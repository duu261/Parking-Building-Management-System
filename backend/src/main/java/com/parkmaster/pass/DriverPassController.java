package com.parkmaster.pass;

import com.parkmaster.pass.PassDtos.PassResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver/passes")
class DriverPassController {

    private final MonthlyPassRepository passes;

    DriverPassController(MonthlyPassRepository passes) {
        this.passes = passes;
    }

    @Transactional(readOnly = true)
    @GetMapping
    List<PassResponse> mine(Authentication auth) {
        return passes.findByUser_EmailOrderByCreatedAtDesc(auth.getName()).stream()
                .map(PassResponse::from).toList();
    }
}
