-- Link a session to the driver who owns it. Nullable: staff walk-ins have no account.
ALTER TABLE parking_session
    ADD COLUMN user_id BIGINT REFERENCES users (id);

-- supports a driver listing their own sessions
CREATE INDEX idx_parking_session_user ON parking_session (user_id);
