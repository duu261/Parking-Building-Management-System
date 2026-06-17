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
};
