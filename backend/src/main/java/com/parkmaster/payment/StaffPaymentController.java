package com.parkmaster.payment;

import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import com.parkmaster.payment.PaymentDtos.SettleRequest;
import com.parkmaster.payment.PaymentDtos.VoidRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/payments")
class StaffPaymentController {

    private final PaymentService service;

    StaffPaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping("/pending")
    List<PaymentResponse> pending() {
        return service.listPending();
    }

    @GetMapping("/{id}")
    PaymentResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/{id}/settle")
    PaymentResponse settle(@PathVariable Long id, @Valid @RequestBody SettleRequest req) {
        return service.settle(id, req.method());
    }

    @PostMapping("/{id}/void")
    PaymentResponse voidPayment(@PathVariable Long id, @Valid @RequestBody VoidRequest req) {
        return service.voidPayment(id, req.reason());
    }
}
