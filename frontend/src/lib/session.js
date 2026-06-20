// Session state lives in localStorage. AuthResponse shape from the backend:
// { accessToken, id, email, fullName, role }.
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthed() {
  return Boolean(getToken());
}

export function setSession(authResponse) {
  const { accessToken, ...user } = authResponse;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function homePathForRole() {
  return "/app";
}
