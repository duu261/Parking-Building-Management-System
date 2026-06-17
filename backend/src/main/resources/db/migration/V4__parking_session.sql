CREATE TABLE parking_session (
    id              BIGSERIAL PRIMARY KEY,
    slot_id         BIGINT         NOT NULL REFERENCES parking_slot (id),
    vehicle_type_id BIGINT         NOT NULL REFERENCES vehicle_type (id),
    license_plate   VARCHAR(20)    NOT NULL,
    check_in_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    check_out_at    TIMESTAMPTZ,
    amount_charged  NUMERIC(10, 2),
    status          VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_slot ON parking_session (slot_id);
-- supports active-session lookups and fill-rate / duration metrics (RQ2, RQ4)
CREATE INDEX idx_session_status ON parking_session (status);
CREATE INDEX idx_session_check_in ON parking_session (check_in_at);
