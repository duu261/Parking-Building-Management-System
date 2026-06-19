import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { SquareParking, LogOut, Moon, Sun } from "lucide-react";
import { getUser, clearSession } from "../lib/session";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import { useTheme } from "../hooks/useTheme";

const NAV_ITEMS = [
  { to: "/me", label: "My parking", end: true },
  { to: "/me/reservations", label: "Reservations" },
  { to: "/me/sessions", label: "Sessions" },
];

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
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/me" className="flex items-center gap-2 transition hover:opacity-80">
            <SquareParking className="text-text" size={20} />
            <span className="font-semibold">ParkMaster</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {NAV_ITEMS.map((it) => (
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
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted md:inline">{user?.fullName}</span>
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
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Mobile nav row */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2 text-sm sm:hidden">
          {NAV_ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `shrink-0 rounded-[var(--radius)] px-3 py-1.5 transition ${
                  isActive ? "bg-elevated font-medium text-text" : "text-muted hover:bg-elevated hover:text-text"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
