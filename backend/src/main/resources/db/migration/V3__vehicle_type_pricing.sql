CREATE TABLE vehicle_type (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE pricing_policy (
    id              BIGSERIAL PRIMARY KEY,
    vehicle_type_id BIGINT         NOT NULL UNIQUE REFERENCES vehicle_type (id) ON DELETE CASCADE,
    rate_per_hour   NUMERIC(10, 2) NOT NULL,
    daily_cap       NUMERIC(10, 2),
    grace_minutes   INT            NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);
