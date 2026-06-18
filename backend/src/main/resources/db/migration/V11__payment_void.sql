-- Void/refund a payment. PENDING -> VOIDED cancels an uncollected charge;
-- PAID -> VOIDED records a refund (drops it from revenue, which filters on status = 'PAID').
ALTER TABLE payment
    ADD COLUMN voided_at   TIMESTAMPTZ,
    ADD COLUMN void_reason VARCHAR(255);
