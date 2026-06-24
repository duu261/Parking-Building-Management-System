-- Reservation tiers: FREE (AI at check-in, 10% discount) vs PAID (pick slot, booking fee)

-- Make slot nullable for free reservations (no slot until check-in)
ALTER TABLE reservation ALTER COLUMN slot_id DROP NOT NULL;

-- Reservation type and scheduled arrival
ALTER TABLE reservation ADD COLUMN reservation_type VARCHAR(10) DEFAULT 'FREE' NOT NULL;
ALTER TABLE reservation ADD COLUMN reserved_start TIMESTAMPTZ;

-- Building reference for free reservations (AI needs it at check-in)
ALTER TABLE reservation ADD COLUMN building_id BIGINT REFERENCES parking_building(id);
UPDATE reservation r SET building_id = (
    SELECT f.building_id FROM parking_slot ps JOIN floor f ON ps.floor_id = f.id WHERE ps.id = r.slot_id
) WHERE r.building_id IS NULL AND r.slot_id IS NOT NULL;

-- Deposit tracking for paid reservations
ALTER TABLE reservation ADD COLUMN deposit_amount NUMERIC(10, 2);
ALTER TABLE reservation ADD COLUMN deposit_payment_id BIGINT REFERENCES payment(id);

-- Backfill existing rows
UPDATE reservation SET reserved_start = created_at WHERE reserved_start IS NULL;

-- Session: reservation tracking at checkout
ALTER TABLE parking_session ADD COLUMN deposit_credit NUMERIC(10, 2);
ALTER TABLE parking_session ADD COLUMN from_reservation BOOLEAN DEFAULT FALSE NOT NULL;

-- Index for reservation sweep and lookup
CREATE INDEX idx_reservation_type_status ON reservation(reservation_type, status, reserved_start);
