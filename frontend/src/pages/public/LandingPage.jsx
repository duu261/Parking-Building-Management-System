import { Link } from "react-router-dom";
import { SquareParking, ArrowRight } from "lucide-react";
import { STATUS_COLOR } from "../../lib/status";

const LEGEND = [
  ["AVAILABLE", "Open"],
  ["OCCUPIED", "Parked"],
  ["RESERVED", "Reserved"],
  ["LOCKED", "Held"],
  ["MAINTENANCE", "Closed"],
];

// A believable floor snapshot. This is the real status component, not a mockup:
// the same colors and chips the staff floor view renders.
const FLOOR = [
  "OCCUPIED", "OCCUPIED", "AVAILABLE", "OCCUPIED", "RESERVED", "AVAILABLE",
  "OCCUPIED", "AVAILABLE", "OCCUPIED", "OCCUPIED", "AVAILABLE", "LOCKED",
  "AVAILABLE", "OCCUPIED", "RESERVED", "AVAILABLE", "OCCUPIED", "AVAILABLE",
  "OCCUPIED", "MAINTENANCE", "AVAILABLE", "OCCUPIED", "OCCUPIED", "AVAILABLE",
];

function SlotMap() {
  const open = FLOOR.filter((s) => s === "AVAILABLE").length;
  return (
    <div className="grid-paper rounded-[var(--radius)] border border-line bg-surface/60 p-5 shadow-[var(--shadow-pop)]">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Building A · Level 1</span>
        <span className="nums text-xs text-muted">
          <span className="font-semibold text-text">{open}</span> / {FLOOR.length} open
        </span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {FLOOR.map((status, i) => (
          <div
            key={i}
            title={status}
            className="aspect-[4/3] rounded-md border"
            style={{
              backgroundColor: `color-mix(in oklab, ${STATUS_COLOR[status]} 16%, transparent)`,
              borderColor: `color-mix(in oklab, ${STATUS_COLOR[status]} 45%, transparent)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <SquareParking className="text-text" size={22} />
          <span className="font-semibold tracking-tight">ParkMaster</span>
        </div>
        <Link
          to="/login"
          className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-muted transition hover:bg-elevated hover:text-text"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Every slot, every session, in one quiet view.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Live availability, smart allocation, and role-based control for managers, staff, and drivers.
          </p>
          <div className="mt-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg shadow-[var(--shadow-card)] transition hover:opacity-90 active:translate-y-px"
            >
              Get started <ArrowRight size={16} />
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-line pt-8">
            {LEGEND.map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="text-xs uppercase tracking-wide text-muted">{status}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:pl-6">
          <SlotMap />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-muted">
        ParkMaster · Parking Building Management System
      </footer>
    </div>
  );
}
