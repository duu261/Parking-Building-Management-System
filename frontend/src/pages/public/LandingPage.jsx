import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SquareParking, ArrowRight, Building2, ScanLine, Smartphone } from "lucide-react";
import { STATUS_COLOR } from "../../lib/status";
import { publicApi } from "../../lib/endpoints";
import AllocationShowcase from "../../components/AllocationShowcase";

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

const ROLES = [
  {
    icon: Building2,
    role: "Manager",
    line: "Buildings, floors, pricing, and the analytics that prove the allocation works.",
  },
  {
    icon: ScanLine,
    role: "Staff",
    line: "Check vehicles in and out, handle exceptions, settle payments at the gate.",
  },
  {
    icon: Smartphone,
    role: "Driver",
    line: "See your slot, track your session, scan the ticket, and pay from your phone.",
  },
];

// Light scroll-reveal. Collapses to instant under reduced motion (MOTION dial 3).
const MotionDiv = motion.div;
function LiveAvailability() {
  const [buildings, setBuildings] = useState(null);
  useEffect(() => {
    publicApi
      .buildings()
      .then(async (list) => {
        const withAvail = await Promise.all(
          list.map(async (b) => {
            try {
              const a = await publicApi.availability(b.id);
              return { ...b, availableSlots: a.availableSlots };
            } catch {
              return { ...b, availableSlots: null };
            }
          }),
        );
        setBuildings(withAvail);
      })
      .catch(() => {});
  }, []);
  if (!buildings?.length) return null;
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-center text-lg font-semibold tracking-tight">Live availability</h2>
        <p className="mt-1 text-center text-sm text-muted">Real-time open slots across all buildings.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <Building2 size={20} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <div className="font-medium tracking-tight">{b.name}</div>
                {b.address && <div className="mt-0.5 truncate text-xs text-muted">{b.address}</div>}
              </div>
              <div className="text-right">
                <div className="nums text-2xl font-semibold text-available">
                  {b.availableSlots ?? "-"}
                </div>
                <div className="text-[11px] text-muted">open</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <MotionDiv
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionDiv>
  );
}

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
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
        {LEGEND.map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
            <span className="text-xs text-muted">{label}</span>
          </div>
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
        <nav className="flex items-center gap-1">
          <Link
            to="/pricing"
            className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-muted transition hover:bg-elevated hover:text-text"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-muted transition hover:bg-elevated hover:text-text"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
          <Reveal className="max-w-xl">
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
                Let it park you <ArrowRight size={16} />
              </Link>
            </div>

          </Reveal>

          <Reveal className="lg:pl-6" delay={0.1}>
            <SlotMap />
          </Reveal>
        </section>

        <AllocationShowcase />

        <LiveAvailability />

        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
            <Reveal>
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
                Three people run a parking building. One system serves each of them.
              </h2>
            </Reveal>
            <div className="mt-10 divide-y divide-line border-t border-line">
              {ROLES.map(({ icon: Icon, role, line }, i) => (
                <Reveal key={role} delay={i * 0.06}>
                  <div className="flex items-start gap-5 py-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-line bg-bg text-text">
                      {Icon && <Icon size={18} />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight">{role}</h3>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{line}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted">
          <span>ParkMaster</span>
          <div className="flex gap-4">
            <Link to="/login" className="transition hover:text-text">Sign in</Link>
            <Link to="/signup" className="transition hover:text-text">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
