-- Audit trail on payments: which staff member processed a cash settle/void,
-- and a penalty component kept separate from the base parking charge.
ALTER TABLE payment
    ADD COLUMN processed_by_staff_id BIGINT REFERENCES users (id),
    ADD COLUMN penalty_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- supports manager "cash collected per staff per shift" reporting
CREATE INDEX idx_payment_processed_by_staff ON payment (processed_by_staff_id);
