CREATE TABLE payment (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT         NOT NULL UNIQUE REFERENCES parking_session (id),
    amount     NUMERIC(10, 2) NOT NULL,
    method     VARCHAR(20),
    status     VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    paid_at    TIMESTAMPTZ
);

-- supports the staff "pending payments" queue and manager revenue reporting
CREATE INDEX idx_payment_status ON payment (status);
CREATE INDEX idx_payment_paid_at ON payment (paid_at);
