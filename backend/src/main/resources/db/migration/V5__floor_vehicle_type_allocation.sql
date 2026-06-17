ALTER TABLE floor ADD COLUMN vehicle_type_id BIGINT REFERENCES vehicle_type(id);

ALTER TABLE parking_session ADD COLUMN auto_allocated BOOLEAN NOT NULL DEFAULT FALSE;
