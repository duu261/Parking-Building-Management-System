ALTER TABLE parking_session
    ADD COLUMN allocation_score JSONB;

COMMENT ON COLUMN parking_session.allocation_score IS
    'AI scoring breakdown at check-in time: {vehicleTypeMatch, loadBalance, distanceToEntry, peakHour, total, alternativesConsidered}';
