package com.parkmaster.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

/** Signature build/verify roundtrip — the security-critical part of the VNPay integration. */
class VnPayServiceTest {

    private final VnPayService svc = new VnPayService("TESTCODE", "TESTSECRETKEY1234567890",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            "http://localhost:5000/api/public/payments/vnpay-return");

    @Test
    void buildPaymentUrlContainsRequiredParams() {
        String url = svc.buildPaymentUrl("42_20260621120000", 15000, "Test order", "127.0.0.1");
        Map<String, String> p = VnPayService.parseQuery(url);
        assertThat(p.get("vnp_TmnCode")).isEqualTo("TESTCODE");
        // VNPay wants amount * 100.
        assertThat(p.get("vnp_Amount")).isEqualTo("1500000");
        assertThat(p.get("vnp_TxnRef")).isEqualTo("42_20260621120000");
        assertThat(p.get("vnp_SecureHash")).isNotBlank();
    }

    @Test
    void signedUrlVerifiesTrue() {
        String url = svc.buildPaymentUrl("42_20260621120000", 15000, "Test order", "127.0.0.1");
        Map<String, String> p = VnPayService.parseQuery(url);
        assertThat(svc.isValidSignature(p)).isTrue();
    }

    @Test
    void tamperedAmountFailsVerification() {
        String url = svc.buildPaymentUrl("42_20260621120000", 15000, "Test order", "127.0.0.1");
        Map<String, String> p = VnPayService.parseQuery(url);
        p.put("vnp_Amount", "100"); // attacker lowers the charge
        assertThat(svc.isValidSignature(p)).isFalse();
    }

    @Test
    void missingHashFailsVerification() {
        String url = svc.buildPaymentUrl("42_20260621120000", 15000, "Test order", "127.0.0.1");
        Map<String, String> p = VnPayService.parseQuery(url);
        p.remove("vnp_SecureHash");
        assertThat(svc.isValidSignature(p)).isFalse();
    }
}
