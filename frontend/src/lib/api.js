// Thin fetch wrapper. Prepends /api, attaches the Bearer token, and surfaces
// RFC7807 problem details as Error messages.
const BASE = import.meta.env.VITE_API_URL ?? "";

export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = localStorage.getItem("accessToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.detail || data?.title || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Binary endpoints (the ticket PNG) sit behind the same JWT, so a plain <img src>
// gets a 401. Fetch with the token and hand back an object URL the caller revokes.
export async function apiBlobUrl(path) {
  const headers = {};
  const token = localStorage.getItem("accessToken");
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return URL.createObjectURL(await res.blob());
}
