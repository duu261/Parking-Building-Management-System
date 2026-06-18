// Slot/session status -> CSS color token. Anchors the Control Room palette.
export const STATUS_COLOR = {
  AVAILABLE: "var(--available)",
  OCCUPIED: "var(--occupied)",
  RESERVED: "var(--reserved)",
  MAINTENANCE: "var(--maintenance)",
  LOCKED: "var(--locked)",
  ACTIVE: "var(--available)",
  COMPLETED: "var(--muted)",
  // Reservation lifecycle.
  PENDING: "var(--reserved)",
  FULFILLED: "var(--available)",
  CANCELLED: "var(--muted)",
  EXPIRED: "var(--locked)",
};
