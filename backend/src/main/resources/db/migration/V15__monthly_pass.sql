CREATE TABLE monthly_pass (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id),
    vehicle_type_id BIGINT      NOT NULL REFERENCES vehicle_type (id),
    license_plate   VARCHAR(20) NOT NULL,
    valid_from      DATE        NOT NULL,
    valid_until     DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- supports the checkout lookup (plate + type + status), date range filtered in query
CREATE INDEX idx_monthly_pass_lookup ON monthly_pass (license_plate, vehicle_type_id, status);
