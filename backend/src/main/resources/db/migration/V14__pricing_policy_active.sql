-- Soft-disable flag for a vehicle type's pricing policy. Lets a manager retire
-- a tariff without deleting the row (kept for audit). Existing policies active.
ALTER TABLE pricing_policy
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
