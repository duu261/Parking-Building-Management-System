-- The parking ticket: a unique code per session, encoded into the driver's QR.
ALTER TABLE parking_session
    ADD COLUMN ticket_code VARCHAR(64);

-- Backfill any pre-existing rows so the NOT NULL + UNIQUE constraints hold.
UPDATE parking_session SET ticket_code = gen_random_uuid()::text WHERE ticket_code IS NULL;

ALTER TABLE parking_session
    ALTER COLUMN ticket_code SET NOT NULL,
    ADD CONSTRAINT uq_parking_session_ticket_code UNIQUE (ticket_code);
