package com.parkmaster.payment;

import com.parkmaster.payment.PaymentDtos.PaymentResponse;
import com.parkmaster.payment.PaymentDtos.VnPayStartResponse;
import jakarta.servlet.http.HttpServletRequest;
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

    /** Start a real VNPay checkout; returns the gateway URL for the client to redirect to. */
    @PostMapping("/{id}/vnpay")
    VnPayStartResponse startVnPay(@PathVariable Long id, Authentication auth,
            HttpServletRequest request) {
        return new VnPayStartResponse(service.startVnPay(auth.getName(), id, clientIp(request)));
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
