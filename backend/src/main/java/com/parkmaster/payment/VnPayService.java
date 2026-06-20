package com.parkmaster.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Builds VNPay (v2.1.0) payment URLs and verifies callback signatures.
 *
 * <p>Hashing rule: fields sorted by name, joined as {@code name=urlEncode(value)} pairs with
 * {@code &}, then HMAC-SHA512 with the merchant hash secret. Values are URL-encoded the same way
 * for both the hash data and the query string so VNPay's recomputation matches ours.
 */
@Service
public class VnPayService {

    private static final String VERSION = "2.1.0";
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int EXPIRE_MINUTES = 15;

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;

    public VnPayService(
            @Value("${parkmaster.vnpay.tmn-code}") String tmnCode,
            @Value("${parkmaster.vnpay.hash-secret}") String hashSecret,
            @Value("${parkmaster.vnpay.pay-url}") String payUrl,
            @Value("${parkmaster.vnpay.return-url}") String returnUrl) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
    }

    /**
     * Build the redirect URL that sends the driver to VNPay's hosted checkout.
     *
     * @param txnRef unique reference (stored on the Payment) to match the callback back
     * @param amountVnd the charge in VND (whole đồng); VNPay wants this multiplied by 100
     * @param orderInfo human description shown on the gateway
     * @param clientIp originating client IP for fraud checks
     */
    public String buildPaymentUrl(String txnRef, long amountVnd, String orderInfo, String clientIp) {
        ZonedDateTime now = ZonedDateTime.now(VN_ZONE);
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VERSION);
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
        params.put("vnp_CreateDate", now.format(TS));
        params.put("vnp_ExpireDate", now.plusMinutes(EXPIRE_MINUTES).format(TS));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            String encoded = encode(e.getValue());
            hashData.append(e.getKey()).append('=').append(encoded).append('&');
            query.append(encode(e.getKey())).append('=').append(encoded).append('&');
        }
        hashData.setLength(hashData.length() - 1);
        query.setLength(query.length() - 1);

        String secureHash = hmacSha512(hashSecret, hashData.toString());
        return payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Verify a callback's signature: recompute HMAC over all {@code vnp_*} params except the hash
     * fields and compare against {@code vnp_SecureHash}.
     */
    public boolean isValidSignature(Map<String, String> params) {
        String received = params.get("vnp_SecureHash");
        if (received == null || received.isBlank()) {
            return false;
        }
        Map<String, String> signed = new TreeMap<>(params);
        signed.remove("vnp_SecureHash");
        signed.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> e : signed.entrySet()) {
            hashData.append(e.getKey()).append('=').append(encode(e.getValue())).append('&');
        }
        if (hashData.length() > 0) {
            hashData.setLength(hashData.length() - 1);
        }
        String expected = hmacSha512(hashSecret, hashData.toString());
        return expected.equalsIgnoreCase(received);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private static String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.US_ASCII));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute VNPay signature", ex);
        }
    }

    /** Parse a VNPay redirect URL's query string into a decoded param map (test/util helper). */
    static Map<String, String> parseQuery(String url) {
        Map<String, String> out = new HashMap<>();
        String query = url.substring(url.indexOf('?') + 1);
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            out.put(
                    java.net.URLDecoder.decode(pair.substring(0, eq), StandardCharsets.US_ASCII),
                    java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.US_ASCII));
        }
        return out;
    }
}
