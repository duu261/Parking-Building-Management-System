package com.parkmaster.payment;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public VNPay callback (no JWT — VNPay/browser hits this directly). Verifies the signature,
 * updates the payment, then redirects the browser to the frontend result page.
 */
@RestController
@RequestMapping("/api/public/payments")
class PublicPaymentController {

    private final PaymentService service;
    private final String resultUrl;

    PublicPaymentController(PaymentService service,
            @Value("${parkmaster.vnpay.result-url}") String resultUrl) {
        this.service = service;
        this.resultUrl = resultUrl;
    }

    @GetMapping("/vnpay-return")
    ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        VnPayResult.Outcome outcome = service.handleVnPayReturn(params);
        String ref = params.getOrDefault("vnp_TxnRef", "");
        String page = outcome.passPayment() ? "/my-passes" : "/sessions";
        String target = resultUrl + page + "?status=" + outcome.result().name().toLowerCase()
                + "&ref=" + URLEncoder.encode(ref, StandardCharsets.UTF_8);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(target)).build();
    }
}
