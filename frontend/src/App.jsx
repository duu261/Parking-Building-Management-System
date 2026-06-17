import { useState } from "react";
import { Moon, Sun, SquareParking } from "lucide-react";

// Temporary smoke screen: proves the Control Room token system renders in
// both themes. Replaced by the router + real screens in the next step.
const STATUS = [
  { key: "AVAILABLE", label: "Available", color: "var(--available)" },
  { key: "OCCUPIED", label: "Occupied", color: "var(--occupied)" },
  { key: "RESERVED", label: "Reserved", color: "var(--reserved)" },
  { key: "MAINTENANCE", label: "Maintenance", color: "var(--maintenance)" },
  { key: "LOCKED", label: "Locked", color: "var(--locked)" },
];

const SAMPLE = ["AVAILABLE", "OCCUPIED", "AVAILABLE", "RESERVED", "MAINTENANCE", "AVAILABLE", "LOCKED", "OCCUPIED"];

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-bg text-text">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <SquareParking className="text-accent" size={22} />
            <span className="font-semibold tracking-tight">ParkMaster</span>
            <span className="text-muted text-sm">Control Room</span>
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-elevated"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-lg font-semibold">Slot status palette</h1>
          <p className="text-muted mt-1 text-sm">
            Semantic colors anchor the system. Neutrals stay quiet.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            {STATUS.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span className="size-3 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3">
            {SAMPLE.map((status, i) => {
              const color = STATUS.find((s) => s.key === status).color;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-line bg-surface p-3"
                >
                  <div className="nums text-sm font-medium">A-{201 + i}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                    {status}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
