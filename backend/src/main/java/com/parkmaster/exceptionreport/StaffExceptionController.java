package com.parkmaster.exceptionreport;

import com.parkmaster.exceptionreport.ExceptionDtos.CreateExceptionRequest;
import com.parkmaster.exceptionreport.ExceptionDtos.ExceptionResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/exceptions")
class StaffExceptionController {

    private final ExceptionReportService service;

    StaffExceptionController(ExceptionReportService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<ExceptionResponse> create(@Valid @RequestBody CreateExceptionRequest req,
            Authentication auth) {
        ExceptionResponse created = service.create(auth.getName(), req.type(), req.description(),
                req.sessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/open")
    List<ExceptionResponse> open() {
        return service.listOpen();
    }

    @GetMapping("/{id}")
    ExceptionResponse get(@PathVariable Long id) {
        return service.get(id);
    }
}
