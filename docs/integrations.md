# Integrations — ParkMaster

**Last Updated:** 2026-06-24

External service integrations for AI assistance and payment processing.

---

## Google Gemini API

**Purpose:** AI-powered parking assistant and knowledge retrieval  
**Package:** `com.parkmaster.assistant`  
**Entry Point:** `GeminiClient`, `AssistantService`

### Configuration

**Environment Variables:**
```bash
GEMINI_API_KEY=<your-api-key>
```

Store in:
- Local dev: `.env` or `application-dev.yml`
- Render production: Environment variable in Render dashboard

**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

### Usage

#### Chat Endpoint
```
POST /api/public/assistant/chat
Body: { "message": "...", "history": [...] }
Response: { "reply": "...", "source": "ai|local" }
```

**Behavior:**
- If Gemini API is reachable: calls API with parking system context (building info, pricing, reservation/pass knowledge)
- If Gemini fails or API key missing: falls back to local knowledge base (`source: "local"`)
- Response includes allocation scores and live availability data

**Knowledge Base:** Hardcoded in `AssistantService`:
- Building info, floor/slot structure
- Pricing policies (rate/hour, daily cap, grace periods, peak multipliers)
- Reservation TTL (15 min)
- Monthly pass workflow
- Payment methods (CASH, ONLINE, VNPAY)
- Exception types (lost ticket, wrong plate, overtime, wrong zone)
- AI allocation criteria (vehicle type match, floor load, distance, peak hour)

### Response Format

```json
{
  "reply": "The slot D-2-15 is on floor 2, 50m from main entry, best match for motorcycles.",
  "source": "ai"
}
```

### Error Handling

- **API Key missing:** Logs warning, returns local knowledge response
- **API timeout (>5s):** Timeout after 5s, returns local response
- **HTTP 429 (quota exceeded):** Falls back to local response, logs rate limit event
- **Malformed response:** Logs error, returns generic fallback message

### Rate Limiting

- Gemini: Standard free tier quotas (adjust via GCP console)
- Local fallback: No rate limit

### Testing

Inject `GeminiClient` as mock in tests:
```java
@Test
void testChatFallsBackWhenApiFails() {
    // Mock GeminiClient.generate() to throw IOException
    // Verify AssistantService returns local knowledge
}
```

### Future Enhancements

- Session-scoped context (remember driver's building/vehicle type in conversation)
- Fine-tuning with live analytics (occupancy trends, peak hours)
- Feedback loop: rate assistant replies, improve over time

---

## VNPay Payment Gateway

**Purpose:** Online payment processing via Vietnamese payment aggregator  
**Package:** `com.parkmaster.payment`  
**Entry Point:** `VnPayService`, `PublicPaymentController`

### Configuration

**Environment Variables:**
```bash
VNPAY_TMN_CODE=<merchant-id>
VNPAY_HASH_SECRET=<hmac-secret>
VNPAY_RETURN_URL=<frontend-url>/vnpay-return
VNPAY_NOTIFY_URL=<backend-url>/api/public/payments/vnpay-notify
```

**API Endpoint (Sandbox):** `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`  
**API Endpoint (Production):** `https://secure.vnpayment.vn/paymentv2/vpcpay.html`

### Workflow

```
1. Driver initiates payment for session or monthly pass
   POST /api/driver/payments/{id}/pay { method: "VNPAY" }

2. Backend generates secure redirect link
   - Build payment params (amount, orderId, description, etc.)
   - HMAC-SHA512 sign the request
   - Return redirect URL to frontend

3. Frontend redirects user to VNPay checkout page
   User enters card/bank details and confirms payment

4. VNPay processes transaction
   - Calls backend webhook: /api/public/payments/vnpay-notify (server-to-server)
   - Redirects user: VNPAY_RETURN_URL with payment status (browser)

5. Backend webhook handler (PublicPaymentController.handleVnPayNotify)
   - Verify HMAC signature
   - Update payment status (PAID or FAILED)
   - Mark session/pass as active if successful
   - Return HTTP 200 to VNPay

6. Browser callback handler (PublicPaymentController.handleVnPayReturn)
   - Display payment result page to driver
   - Redirect to /driver/payments on success
```

### Response Format

**Return URL (browser redirect):**
```
/api/public/payments/vnpay-return?vnp_Amount=5000000&vnp_OrderInfo=...&vnp_ResponseCode=00&...
```

**Webhook Notification (server-to-server):**
```json
{
  "vnp_TxnRef": "ORDER_20240624_001",
  "vnp_Amount": 5000000,
  "vnp_ResponseCode": "00",
  "vnp_SecureHash": "...",
  "vnp_TransactionDate": "20240624120000"
}
```

### Security

- **HMAC-SHA512 Signature:** All requests signed with `VNPAY_HASH_SECRET`
- **Signature Verification:** Backend validates every callback before processing
- **Idempotency:** Check for duplicate orderId before updating payment
- **HTTPS Only:** All endpoints use HTTPS in production

### Amount Handling

- VNPay expects amount in **Vietnamese Dong (VND) × 100**
- Internal DB stores in VND
- When sending to VNPay: `amount = price_vnd * 100`
- When receiving: `amount / 100 = price_vnd`

### Payment Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `PENDING` | Awaiting payment | Driver redirected to VNPay |
| `PAID` | Payment received | Session active or pass issued |
| `VOIDED` | Staff cancelled | Charge refunded or session reset |
| `FAILED` | Payment declined | Driver retries or chooses different method |

### Error Scenarios

| Error | Code | Handling |
|-------|------|----------|
| Signature mismatch | `vnp_ResponseCode != 00` | Payment rejected, no status update |
| Duplicate order | Idempotent check | Logs warning, no double-charge |
| Timeout | Webhook never arrives | Session remains `AWAITING_PAYMENT`, driver can retry or contact support |
| Invalid amount | Amount mismatch | Payment rejected by VNPay, driver sees error |

### Testing

**Sandbox Credentials:**
```
TMN_CODE: TMNCODE
HASH_SECRET: <sandbox-secret>
Test Cards: VNPay provides test card numbers on sandbox dashboard
```

**Local Test Flow:**
1. Disable signature check: `VNPAY_VERIFY_SIGNATURE=false` (dev only)
2. Mock VnPayService to return hardcoded payment URL
3. Simulate webhook callback via curl:
   ```bash
   curl -X GET "http://localhost:5000/api/public/payments/vnpay-return?vnp_Amount=5000000&vnp_ResponseCode=00&..."
   ```

### Monitoring

- **Payment logs:** `PaymentService` logs all VNPay interactions
- **Failed payments:** Query `payments` table where `status = FAILED`, export for reconciliation
- **Webhook failures:** If webhook doesn't reach backend, VNPay retries up to 5 times
- **Metrics:** Track conversion rate = paid_payments / initiated_payments

### Future Enhancements

- Webhook retry mechanism (v2: async queue for failed notifications)
- Partial refunds (current: full void only)
- Payment method diversity (credit card, e-wallet, bank transfer)
- Real-time reconciliation dashboard for managers

---

## Integration Health Checks

### Gemini API

```bash
# Test from backend
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent \
  -d '{"contents": [{"parts": [{"text": "test"}]}]}'
```

**Live Status:** Check dashboard at `/api/public/assistant/chat` endpoint

### VNPay

```bash
# Test from backend (sandbox)
# Generate a test payment URL and verify redirect
# Then simulate webhook callback
curl -X GET "http://localhost:5000/api/public/payments/vnpay-return?vnp_Amount=100000&vnp_ResponseCode=00&..."
```

**Live Status:** VNPay provides merchant dashboard with transaction logs

---

## Dependency Versions

| Service | Library | Version |
|---------|---------|---------|
| Google Gemini | google-generativeai (via HTTP REST) | Latest (REST calls, no SDK) |
| VNPay | Spring Framework (HTTP, HMAC-SHA512) | 3.3+ (no dedicated SDK) |

