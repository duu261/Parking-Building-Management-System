CREATE TABLE exception_report (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT      REFERENCES parking_session (id),
    reported_by     BIGINT      NOT NULL REFERENCES users (id),
    type            VARCHAR(20) NOT NULL,
    description     TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

-- supports the staff "open exceptions" queue
CREATE INDEX idx_exception_report_status ON exception_report (status, created_at);
