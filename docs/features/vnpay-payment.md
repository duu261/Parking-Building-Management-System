# VNPay Online Payment Gateway

Real Vietnam payment gateway (VNPay sandbox, API v2.1.0). A driver pays a pending
parking charge online: the backend builds a signed checkout URL, VNPay collects the
money on its hosted page, then calls back to the backend which verifies the signature
and settles the payment. Replaces the earlier mock "pay online" stub. Builds on the
core [Payment](payment.md) flow.

## Why it matters

- VNPay is the de-facto payment gateway for SWP391 / Vietnamese student projects.
- Demonstrates a real third-party integration: redirect flow, HMAC signing,
  server-to-server verification, idempotent settlement — not a fake button.

## Actors & flow

```mermaid
sequenceDiagram
    participant D as Driver (browser)
    participant BE as ParkMaster backend
    participant VP as VNPay sandbox

    D->>BE: POST /api/driver/payments/{id}/vnpay
    BE->>BE: ownership check, generate gatewayRef, sign params (HMAC-SHA512)
    BE-->>D: { paymentUrl }
    D->>VP: redirect to paymentUrl, pay on hosted page
    VP-->>D: redirect to vnp_ReturnUrl (backend callback) with result + hash
    D->>BE: GET /api/public/payments/vnpay-return?vnp_*
    BE->>BE: verify hash, match gatewayRef, check amount, settle (idempotent)
    BE-->>D: 302 redirect to frontend result page (?status=&ref=)
```

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/driver/payments/{id}/vnpay` | USER (own payment) | Start checkout → `{ paymentUrl }` |
| GET | `/api/public/payments/vnpay-return` | public (no JWT) | VNPay callback → verify, settle, redirect |

The callback is **public** on purpose: it is hit by the user's browser (and could be
hit by VNPay's servers), which carry no app JWT. Trust comes from the signature, not
from auth. Non-owner start requests return `404` (no ownership leak); already-paid or
voided payments return `409`.

## Signature (the security-critical part)

VNPay v2.1.0 rule, applied identically when signing and verifying:

1. Sort all `vnp_*` fields by name.
2. Join as `name=urlEncode(value)` pairs separated by `&` → the *hash data*.
3. `vnp_SecureHash = HMAC-SHA512(merchantHashSecret, hashData)` (lowercase hex).

Verification recomputes the HMAC over every returned field except `vnp_SecureHash`
/ `vnp_SecureHashType` and compares (case-insensitive). On the callback the backend
also re-checks `vnp_ResponseCode == "00"`, `vnp_TransactionStatus == "00"`, and that
`vnp_Amount` equals the stored charge × 100 — so a tampered amount or a forged
"success" is rejected. Amounts are sent in VND × 100 per VNPay convention.

`VnPayService` owns URL building + verification and is unit-tested in isolation
(`VnPayServiceTest`): sign→verify roundtrip, tampered amount, and missing hash.

## Idempotent settlement

`vnp_TxnRef` is `paymentId_yyyyMMddHHmmss` (Asia/Ho_Chi_Minh), unique per attempt and
stored on the Payment as `gatewayRef`. The callback looks the payment up by that ref.
Settlement only fires when the payment is still `PENDING`, so a duplicated callback
(browser refresh, retry) records the gateway response without double-charging or
re-opening a completed session. On success the payment becomes `PAID` with method
`VNPAY`, and the session's slot is freed via the shared check-out completion path.

## Model & schema — `V16__payment_vnpay.sql`

Three columns added to `payment`:

| Column | Maps to | Notes |
|---|---|---|
| `gateway_ref` | `vnp_TxnRef` we generated | unique index; matches the callback back |
| `gateway_txn_no` | `vnp_TransactionNo` | VNPay's own transaction id |
| `gateway_response_code` | `vnp_ResponseCode` | `"00"` = success |

`PaymentMethod` gains `VNPAY` (alongside `CASH`, `ONLINE`).

## Configuration (`parkmaster.vnpay.*`)

| Property | Env | Default |
|---|---|---|
| `tmn-code` | `VNPAY_TMN_CODE` | _(empty)_ |
| `hash-secret` | `VNPAY_HASH_SECRET` | _(empty)_ |
| `pay-url` | `VNPAY_PAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `return-url` | `VNPAY_RETURN_URL` | `http://localhost:5000/api/public/payments/vnpay-return` |
| `result-url` | `VNPAY_RESULT_URL` | `http://localhost:5173/driver/payments` |

To transact, register a sandbox merchant at <https://sandbox.vnpayment.vn> and set
`VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET`. In a deployed setup, `return-url` must be the
backend's public callback URL.

## Scope note

Settlement is driven by the **return** callback, which is authoritative and
idempotent — it fires for both local and deployed demos. A separate IPN
(server-to-server) endpoint is intentionally omitted; it would only add value as a
fallback when a user closes the browser before the redirect completes on the deployed
app, and reuses the same verify-and-settle logic.

## Frontend status

Backend complete. Frontend wiring pending: a "Pay with VNPay" button that calls the
start endpoint and does `window.location = paymentUrl`, plus a result view that reads
`?status=` / `?ref=` after the redirect back.
