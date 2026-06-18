package com.parkmaster.payment;

import com.parkmaster.payment.PaymentDtos.RevenueResponse;
import java.time.Instant;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/payments")
class ManagerPaymentController {

    private final PaymentService service;

    ManagerPaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping("/revenue")
    RevenueResponse revenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.revenue(from, to);
    }
}
