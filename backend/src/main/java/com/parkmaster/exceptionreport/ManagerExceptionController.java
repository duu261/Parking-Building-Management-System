package com.parkmaster.exceptionreport;

import com.parkmaster.exceptionreport.ExceptionDtos.ExceptionResponse;
import com.parkmaster.exceptionreport.ExceptionDtos.ResolveExceptionRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/exceptions")
class ManagerExceptionController {

    private final ExceptionReportService service;

    ManagerExceptionController(ExceptionReportService service) {
        this.service = service;
    }

    @GetMapping
    List<ExceptionResponse> all() {
        return service.listAll();
    }

    @GetMapping("/open")
    List<ExceptionResponse> open() {
        return service.listOpen();
    }

    @PostMapping("/{id}/resolve")
    ExceptionResponse resolve(@PathVariable Long id, @Valid @RequestBody ResolveExceptionRequest req) {
        return service.resolve(id, req.resolutionNote());
    }
}
