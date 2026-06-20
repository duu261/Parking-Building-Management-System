-- VNPay gateway fields on payment: our txn ref, VNPay's txn number, response code.
ALTER TABLE payment
    ADD COLUMN gateway_ref VARCHAR(64),
    ADD COLUMN gateway_txn_no VARCHAR(64),
    ADD COLUMN gateway_response_code VARCHAR(8);

-- One in-flight gateway ref per attempt; NULLs allowed (cash/online payments).
CREATE UNIQUE INDEX ux_payment_gateway_ref ON payment (gateway_ref);
