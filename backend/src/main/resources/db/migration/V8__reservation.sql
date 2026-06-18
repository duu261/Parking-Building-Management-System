CREATE TABLE reservation (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id),
    slot_id         BIGINT      NOT NULL REFERENCES parking_slot (id),
    vehicle_type_id BIGINT      NOT NULL REFERENCES vehicle_type (id),
    license_plate   VARCHAR(20) NOT NULL,
    hold_until      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

-- supports the expiry sweep (status + hold_until) and a driver's own list
CREATE INDEX idx_reservation_sweep ON reservation (status, hold_until);
CREATE INDEX idx_reservation_user ON reservation (user_id);
