package com.parkmaster.session;

public enum SessionStatus {
    ACTIVE,
    // Driver has checked out but the charge is not yet settled. Slot stays
    // OCCUPIED so the allocator cannot hand it out while the car is still
    // physically present at the payment booth.
    AWAITING_PAYMENT,
    COMPLETED
}
