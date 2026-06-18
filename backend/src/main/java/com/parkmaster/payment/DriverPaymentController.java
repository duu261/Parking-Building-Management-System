package com.parkmaster.payment;

import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Driver self-service: view and pay your own payments (ONLINE). Ownership in the service.
@RestController
@RequestMapping("/api/driver/payments")
class DriverPaymentController {

    private final PaymentService service;

    DriverPaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping
    List<PaymentResponse> mine(Authentication auth) {
        return service.listForUser(auth.getName());
    }

    @PostMapping("/{id}/pay")
    PaymentResponse pay(@PathVariable Long id, Authentication auth) {
        return service.payOwn(auth.getName(), id);
    }
}
