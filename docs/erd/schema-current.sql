-- ParkMaster current database schema
-- Source: backend Flyway migrations V1 through V23.
-- Generated for reporting/ERD documentation only.

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parking_building (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_type (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE floor (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES parking_building (id) ON DELETE CASCADE,
    vehicle_type_id BIGINT REFERENCES vehicle_type (id),
    level INT NOT NULL,
    name VARCHAR(60) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (building_id, level)
);

CREATE TABLE parking_slot (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floor (id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (floor_id, code)
);

CREATE TABLE pricing_policy (
    id BIGSERIAL PRIMARY KEY,
    vehicle_type_id BIGINT NOT NULL UNIQUE REFERENCES vehicle_type (id) ON DELETE CASCADE,
    rate_per_hour NUMERIC(10, 2) NOT NULL,
    daily_cap NUMERIC(10, 2),
    grace_minutes INT NOT NULL DEFAULT 0,
    peak_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    monthly_pass_price NUMERIC(10, 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parking_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users (id),
    slot_id BIGINT NOT NULL REFERENCES parking_slot (id),
    vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_type (id),
    license_plate VARCHAR(20) NOT NULL,
    ticket_code VARCHAR(64) NOT NULL UNIQUE,
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_at TIMESTAMPTZ,
    amount_charged NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    auto_allocated BOOLEAN NOT NULL DEFAULT FALSE,
    allocation_score JSONB,
    deposit_credit NUMERIC(10, 2),
    from_reservation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT UNIQUE REFERENCES parking_session (id),
    processed_by_staff_id BIGINT REFERENCES users (id),
    amount NUMERIC(10, 2) NOT NULL,
    penalty_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    method VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description VARCHAR(255),
    gateway_ref VARCHAR(64),
    gateway_txn_no VARCHAR(64),
    gateway_response_code VARCHAR(8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    void_reason VARCHAR(255)
);

CREATE TABLE reservation (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    slot_id BIGINT REFERENCES parking_slot (id),
    vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_type (id),
    building_id BIGINT REFERENCES parking_building (id),
    deposit_payment_id BIGINT REFERENCES payment (id),
    license_plate VARCHAR(20) NOT NULL,
    hold_until TIMESTAMPTZ NOT NULL,
    reserved_start TIMESTAMPTZ,
    reservation_type VARCHAR(10) NOT NULL DEFAULT 'FREE',
    deposit_amount NUMERIC(10, 2),
    allocation_score JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE exception_report (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES parking_session (id),
    reported_by BIGINT NOT NULL REFERENCES users (id),
    type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE monthly_pass (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_type (id),
    payment_id BIGINT REFERENCES payment (id),
    license_plate VARCHAR(20) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feedback (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES parking_session (id),
    user_id BIGINT NOT NULL REFERENCES users (id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_floor_building ON floor (building_id);
CREATE INDEX idx_slot_floor ON parking_slot (floor_id);
CREATE INDEX idx_slot_status ON parking_slot (status);
CREATE INDEX idx_session_slot ON parking_session (slot_id);
CREATE INDEX idx_session_status ON parking_session (status);
CREATE INDEX idx_session_check_in ON parking_session (check_in_at);
CREATE INDEX idx_parking_session_user ON parking_session (user_id);
CREATE INDEX idx_payment_status ON payment (status);
CREATE INDEX idx_payment_paid_at ON payment (paid_at);
CREATE INDEX idx_payment_processed_by_staff ON payment (processed_by_staff_id);
CREATE UNIQUE INDEX ux_payment_gateway_ref ON payment (gateway_ref);
CREATE INDEX idx_reservation_sweep ON reservation (status, hold_until);
CREATE INDEX idx_reservation_user ON reservation (user_id);
CREATE INDEX idx_reservation_type_status ON reservation (reservation_type, status, reserved_start);
CREATE INDEX idx_exception_report_status ON exception_report (status, created_at);
CREATE INDEX idx_monthly_pass_lookup ON monthly_pass (license_plate, vehicle_type_id, status);
