import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  SquareParking,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Building2,
  Tags,
  Users,
  BarChart3,
  ListChecks,
  TriangleAlert,
  Banknote,
  Menu,
  X,
} from "lucide-react";
import { getUser, clearSession } from "../lib/session";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import { useTheme } from "../hooks/useTheme";

// Nav per role. STAFF runs the floor; MANAGER/ADMIN administer.
const NAV = {
  STAFF: [
    { to: "/app/check-in", label: "Check-in", icon: LogIn },
    { to: "/app/active", label: "Active sessions", icon: ListChecks },
    { to: "/app/payments", label: "Payments", icon: Banknote },
    { to: "/app/exceptions", label: "Exceptions", icon: TriangleAlert },
  ],
  MANAGER: [
    { to: "/app", label: "Overview", icon: BarChart3, end: true },
    { to: "/app/buildings", label: "Buildings", icon: Building2 },
    { to: "/app/pricing", label: "Pricing", icon: Tags },
    { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ADMIN: [
    { to: "/app", label: "Overview", icon: BarChart3, end: true },
    { to: "/app/users", label: "Users", icon: Users },
    { to: "/app/buildings", label: "Buildings", icon: Building2 },
    { to: "/app/pricing", label: "Pricing", icon: Tags },
  ],
};

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function SidebarNav({ items }) {
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-2">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition ${
              isActive
                ? "bg-elevated font-medium text-text"
                : "text-muted hover:bg-elevated hover:text-text"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-text transition-all ${
                  isActive ? "h-5 w-[3px]" : "h-0 w-0"
                }`}
              />
              <it.icon size={18} className="shrink-0" />
              {it.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserBadge({ user }) {
  return (
    <div className="flex items-center gap-3 border-t border-line px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-text text-xs font-semibold text-accent-fg">
        {initials(user?.fullName)}
      </span>
      <div className="min-w-0 text-xs">
        <div className="truncate font-medium text-text">{user?.fullName}</div>
        <div className="truncate uppercase tracking-wide text-muted">{user?.role}</div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  useInactivityLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const user = getUser();
  const items = NAV[user?.role] ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] bg-bg text-text">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface sm:flex">
        <Link to="/app" className="flex items-center gap-2 px-5 py-4 transition hover:opacity-80">
          <SquareParking className="text-text" size={20} />
          <span className="font-semibold tracking-tight">ParkMaster</span>
        </Link>
        <SidebarNav items={items} />
        <UserBadge user={user} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-lg">
            <div className="flex items-center justify-between px-5 py-4">
              <Link to="/app" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <SquareParking className="text-text" size={20} />
                <span className="font-semibold tracking-tight">ParkMaster</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-muted">
                <X size={20} />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <SidebarNav items={items} />
            </div>
            <div className="mt-auto">
              <UserBadge user={user} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 sm:hidden">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-muted">
              <Menu size={20} />
            </button>
            <Link to="/app" className="flex items-center gap-2 transition hover:opacity-80">
              <SquareParking className="text-text" size={20} />
              <span className="font-semibold">ParkMaster</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
