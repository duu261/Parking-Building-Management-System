import { useEffect, useRef } from "react";
import { clearSession, getStayLoggedIn } from "../lib/session";

const TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];

// Logs the user out after 60 minutes of inactivity. Skipped if "stay logged in" is set.
export function useInactivityLogout() {
  const timer = useRef(null);

  useEffect(() => {
    if (getStayLoggedIn()) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        clearSession();
        window.location.replace("/login");
      }, TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
}
