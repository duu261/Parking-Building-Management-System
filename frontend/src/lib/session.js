// Session state lives in localStorage. AuthResponse shape from the backend:
// { accessToken, id, email, fullName, role }.
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const STAY_KEY = "stayLoggedIn";

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
  localStorage.removeItem(STAY_KEY);
}

export function setStayLoggedIn(value) {
  localStorage.setItem(STAY_KEY, value ? "1" : "0");
}

export function getStayLoggedIn() {
  return localStorage.getItem(STAY_KEY) === "1";
}

export function homePathForRole() {
  return "/app";
}
