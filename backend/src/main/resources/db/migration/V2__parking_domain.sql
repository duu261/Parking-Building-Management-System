CREATE TABLE parking_building (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    address    VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE floor (
    id          BIGSERIAL PRIMARY KEY,
    building_id BIGINT      NOT NULL REFERENCES parking_building (id) ON DELETE CASCADE,
    level       INT         NOT NULL,
    name        VARCHAR(60) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (building_id, level)
);

CREATE TABLE parking_slot (
    id         BIGSERIAL PRIMARY KEY,
    floor_id   BIGINT      NOT NULL REFERENCES floor (id) ON DELETE CASCADE,
    code       VARCHAR(20) NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (floor_id, code)
);

CREATE INDEX idx_floor_building ON floor (building_id);
CREATE INDEX idx_slot_floor ON parking_slot (floor_id);
-- supports fill-rate / utilization queries (RQ1, RQ4)
CREATE INDEX idx_slot_status ON parking_slot (status);
