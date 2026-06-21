import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SquareParking, ArrowRight, Building2, ScanLine, Smartphone, Sparkles, MessageCircle } from "lucide-react";
import { publicApi } from "../../lib/endpoints";
import AllocationShowcase from "../../components/AllocationShowcase";


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
  {
    icon: MessageCircle,
    role: "AI Assistant",
    line: "Ask our AI about pricing, availability, or how parking works — instant answers powered by Gemini.",
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
              return { ...b, ...a };
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
          {buildings.map((b) => {
            const total = b.totalSlots ?? 0;
            const open = b.availableSlots ?? 0;
            const pct = total > 0 ? Math.round((open / total) * 100) : 0;
            return (
              <div
                key={b.id}
                className="rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-4">
                  <Building2 size={20} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium tracking-tight">{b.name}</div>
                    {b.address && <div className="mt-0.5 truncate text-xs text-muted">{b.address}</div>}
                  </div>
                  <div className="text-right">
                    <div className="nums text-2xl font-semibold text-available">{open}</div>
                    <div className="nums text-[11px] text-muted">{open}/{total}</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct > 50 ? "var(--available)" : pct > 20 ? "var(--reserved)" : "var(--occupied)",
                    }}
                  />
                </div>
                {b.floors?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
                    {b.floors.map((f) => (
                      <div key={f.id} className="flex justify-between">
                        <span>{f.name}</span>
                        <span className="nums">{f.availableSlots ?? "–"}/{f.totalSlots ?? "–"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
        <section className="relative overflow-hidden border-b border-line bg-surface">
          <MotionDiv
            className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-28"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles size={12} /> AI-Powered Smart Parking
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Your car. Our AI.{" "}
              <span className="text-accent">The perfect spot.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              No manual picking. No circling floors. ParkMaster scores every open slot
              on four criteria and assigns the best one in milliseconds — for drivers,
              staff, and reservations.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="rounded-[var(--radius)] bg-accent px-6 py-3 text-sm font-medium text-accent-fg shadow-[var(--shadow-card)] transition hover:opacity-90 active:translate-y-px"
              >
                Get started free
              </Link>
              <a
                href="#ai-demo"
                className="rounded-[var(--radius)] border border-line bg-surface px-6 py-3 text-sm font-medium transition hover:bg-elevated"
              >
                See it live ↓
              </a>
            </div>
          </MotionDiv>
        </section>

        <section className="border-b border-line bg-elevated/30">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Arrive", desc: "Drive in. Staff scans your plate or you scan your reservation QR." },
                { step: "2", title: "AI scores every slot", desc: "Vehicle type match, floor load, distance to entry, peak-hour bonus — all weighted in milliseconds." },
                { step: "3", title: "Park in the best one", desc: "The highest-scoring slot is assigned. No circling, no guessing, no manual override." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div id="ai-demo">
          <AllocationShowcase />
        </div>

        <LiveAvailability />

        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
            <Reveal>
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
                One system. Four perspectives. All powered by AI.
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
