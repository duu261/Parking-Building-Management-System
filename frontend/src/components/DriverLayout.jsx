import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { SquareParking, LogOut, Moon, Sun } from "lucide-react";
import { getUser, clearSession } from "../lib/session";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import { useTheme } from "../hooks/useTheme";

export default function DriverLayout() {
  useInactivityLogout();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const user = getUser();

  const logout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <SquareParking className="text-text" size={20} />
            <span className="font-semibold">ParkMaster</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {[
              { to: "/me", label: "My parking", end: true },
              { to: "/me/sessions", label: "Sessions" },
            ].map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `rounded-[var(--radius)] px-3 py-1.5 transition ${
                    isActive ? "bg-elevated font-medium text-text" : "text-muted hover:bg-elevated hover:text-text"
                  }`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline">{user?.fullName}</span>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius)] border border-line text-muted transition hover:bg-elevated hover:text-text"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-line px-3 py-1.5 text-sm text-muted transition hover:bg-elevated hover:text-text"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
