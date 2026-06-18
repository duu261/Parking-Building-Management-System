import { apiRequest } from "./api";

export const authApi = {
  login: (body) => apiRequest("/auth/login", { method: "POST", body, auth: false }),
  register: (body) => apiRequest("/auth/register", { method: "POST", body, auth: false }),
};

export const staffApi = {
  vehicleTypes: () => apiRequest("/staff/vehicle-types"),
  buildings: () => apiRequest("/staff/buildings"),
  floors: (buildingId) => apiRequest(`/staff/buildings/${buildingId}/floors`),
  slots: (floorId) => apiRequest(`/staff/floors/${floorId}/slots`),
  checkIn: (body) => apiRequest("/staff/sessions/check-in", { method: "POST", body }),
  checkOut: (id) => apiRequest(`/staff/sessions/${id}/check-out`, { method: "POST" }),
  active: () => apiRequest("/staff/sessions/active"),

  pendingPayments: () => apiRequest("/staff/payments/pending"),
  settlePayment: (id, method = "CASH") =>
    apiRequest(`/staff/payments/${id}/settle`, { method: "POST", body: { method } }),
  voidPayment: (id, reason) =>
    apiRequest(`/staff/payments/${id}/void`, { method: "POST", body: { reason } }),

  exceptions: () => apiRequest("/staff/exceptions/open"),
  reportException: (body) => apiRequest("/staff/exceptions", { method: "POST", body }),
  resolveException: (id, resolutionNote) =>
    apiRequest(`/staff/exceptions/${id}/resolve`, { method: "POST", body: { resolutionNote } }),
};

// MANAGER: building/floor/slot CRUD, pricing, revenue, and chart-ready reports.
export const managerApi = {
  buildings: () => apiRequest("/manager/buildings"),
  building: (id) => apiRequest(`/manager/buildings/${id}`),
  createBuilding: (body) => apiRequest("/manager/buildings", { method: "POST", body }),
  updateBuilding: (id, body) => apiRequest(`/manager/buildings/${id}`, { method: "PUT", body }),
  deleteBuilding: (id) => apiRequest(`/manager/buildings/${id}`, { method: "DELETE" }),

  floors: (buildingId) => apiRequest(`/manager/buildings/${buildingId}/floors`),
  createFloor: (buildingId, body) =>
    apiRequest(`/manager/buildings/${buildingId}/floors`, { method: "POST", body }),
  setFloorVehicleType: (id, vehicleTypeId) =>
    apiRequest(`/manager/floors/${id}/vehicle-type`, { method: "PATCH", body: { vehicleTypeId } }),
  deleteFloor: (id) => apiRequest(`/manager/floors/${id}`, { method: "DELETE" }),

  slots: (floorId) => apiRequest(`/manager/floors/${floorId}/slots`),
  createSlot: (floorId, body) =>
    apiRequest(`/manager/floors/${floorId}/slots`, { method: "POST", body }),
  setSlotStatus: (id, status) =>
    apiRequest(`/manager/slots/${id}/status`, { method: "PATCH", body: { status } }),
  deleteSlot: (id) => apiRequest(`/manager/slots/${id}`, { method: "DELETE" }),

  vehicleTypes: () => apiRequest("/manager/vehicle-types"),
  createVehicleType: (body) => apiRequest("/manager/vehicle-types", { method: "POST", body }),
  deleteVehicleType: (id) => apiRequest(`/manager/vehicle-types/${id}`, { method: "DELETE" }),
  pricing: () => apiRequest("/manager/pricing"),
  setPricing: (vehicleTypeId, body) =>
    apiRequest(`/manager/vehicle-types/${vehicleTypeId}/pricing`, { method: "PUT", body }),

  revenue: (from, to) => apiRequest(`/manager/payments/revenue?from=${from}&to=${to}`),

  // Reports take a [from, to) window as ISO instants. Returns { points: [...] }.
  revenueDaily: (from, to) => apiRequest(`/manager/reports/revenue-daily?from=${from}&to=${to}`),
  revenueByType: (from, to) =>
    apiRequest(`/manager/reports/revenue-by-vehicle-type?from=${from}&to=${to}`),
  checkInsByHour: (from, to) =>
    apiRequest(`/manager/reports/check-ins-by-hour?from=${from}&to=${to}`),
  durationByType: (from, to) =>
    apiRequest(`/manager/reports/duration-by-vehicle-type?from=${from}&to=${to}`),
  allocationComparison: (from, to) =>
    apiRequest(`/manager/reports/allocation-comparison?from=${from}&to=${to}`),
};

// ADMIN: user management and role assignment.
export const adminApi = {
  users: () => apiRequest("/admin/users"),
  createUser: (body) => apiRequest("/admin/users", { method: "POST", body }),
  setRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  setActive: (id, active) =>
    apiRequest(`/admin/users/${id}/active`, { method: "PATCH", body: { active } }),
};

// DRIVER: own sessions, ticket QR, and self-service payment.
export const driverApi = {
  sessions: () => apiRequest("/driver/sessions"),
  session: (id) => apiRequest(`/driver/sessions/${id}`),
  ticketUrl: (id) => `/api/driver/sessions/${id}/ticket.png`,
  payments: () => apiRequest("/driver/payments"),
  pay: (id, method = "ONLINE") =>
    apiRequest(`/driver/payments/${id}/pay`, { method: "POST", body: { method } }),

  reservations: () => apiRequest("/driver/reservations"),
  reserve: (body) => apiRequest("/driver/reservations", { method: "POST", body }),
  cancelReservation: (id) =>
    apiRequest(`/driver/reservations/${id}/cancel`, { method: "POST" }),
};

// PUBLIC (guest / SEO): no auth.
export const publicApi = {
  buildings: () => apiRequest("/public/buildings", { auth: false }),
  availability: (id) => apiRequest(`/public/buildings/${id}/availability`, { auth: false }),
  pricing: () => apiRequest("/public/pricing", { auth: false }),
  allocationPreview: (id, vehicleTypeId, limit = 6) =>
    apiRequest(
      `/public/buildings/${id}/allocation-preview?vehicleTypeId=${vehicleTypeId}&limit=${limit}`,
      { auth: false },
    ),
};
