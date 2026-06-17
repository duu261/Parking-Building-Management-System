import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../lib/session";

const TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];

// Logs the user out after 15 minutes without interaction.
export function useInactivityLogout() {
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        clearSession();
        navigate("/login", { replace: true });
      }, TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);
}
