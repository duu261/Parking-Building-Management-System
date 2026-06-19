import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SquareParking, ArrowRight, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { publicApi } from "../../lib/endpoints";

// Public pricing surface (no auth): real policies from /public/pricing, one card per
// vehicle type, plus a plain-language explainer of how a charge is built. Rates are
// VND (project runs in Asia/Ho_Chi_Minh).
const vnd = new Intl.NumberFormat("vi-VN");
const money = (n) => `${vnd.format(Number(n))}₫`;

// Light scroll-reveal, collapses instant under reduced motion (MOTION dial 3).
const MotionDiv = motion.div;
function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <MotionDiv
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionDiv>
  );
}

// How a final charge is built, straight from the ChargeCalculator rules.
const RULES = [
  {
    icon: Clock,
    title: "Grace window first",
    line: "Pull in and out within the grace minutes and you pay nothing.",
  },
  {
    icon: ShieldCheck,
    title: "Capped per day",
    line: "Once the hours add up to the daily cap, the rest of that day is free.",
  },
  {
    icon: TrendingUp,
    title: "Peak multiplier",
    line: "During peak hours the hourly rate scales by the multiplier shown on each plan.",
  },
];

function PolicyCard({ policy }) {
  const { vehicleTypeName, ratePerHour, dailyCap, graceMinutes, peakMultiplier } = policy;
  return (
    <div className="flex flex-col rounded-[var(--radius)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold tracking-tight">{vehicleTypeName}</h3>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="nums text-4xl font-semibold tracking-tight">{money(ratePerHour)}</span>
        <span className="text-sm text-muted">/ hour</span>
      </div>
      <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Daily cap</dt>
          <dd className="nums text-text">{dailyCap ? money(dailyCap) : "None"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Free grace</dt>
          <dd className="nums text-text">{graceMinutes} min</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Peak rate</dt>
          <dd className="nums text-text">{peakMultiplier}&times;</dd>
        </div>
      </dl>
    </div>
  );
}

function PolicySkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-6">
      <div className="h-4 w-24 animate-pulse rounded bg-elevated" />
      <div className="mt-4 h-9 w-32 animate-pulse rounded bg-elevated" />
      <div className="mt-6 space-y-3 border-t border-line pt-5">
        <div className="h-3 w-full animate-pulse rounded bg-elevated" />
        <div className="h-3 w-full animate-pulse rounded bg-elevated" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-elevated" />
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [policies, setPolicies] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .pricing()
      .then((p) => setPolicies(p.filter((x) => x.active)))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <SquareParking className="text-text" size={22} />
          <span className="font-semibold tracking-tight">ParkMaster</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-muted transition hover:bg-elevated hover:text-text"
          >
            Home
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
        <section className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
          <Reveal className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Simple parking rates, no surprises at the gate.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Pay by the hour, capped per day. Here is exactly what each vehicle costs to park.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {error && (
              <div className="rounded-[var(--radius)] border border-occupied/30 bg-occupied/10 px-4 py-3 text-sm text-occupied sm:col-span-2 lg:col-span-3">
                {error}
              </div>
            )}
            {policies === null && !error &&
              Array.from({ length: 3 }).map((_, i) => <PolicySkeleton key={i} />)}
            {policies && policies.length === 0 && (
              <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">
                Pricing is being set up. Check back shortly.
              </p>
            )}
            {policies &&
              policies.map((p, i) => (
                <Reveal key={p.vehicleTypeId} delay={i * 0.05}>
                  <PolicyCard policy={p} />
                </Reveal>
              ))}
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
            <Reveal>
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
                How the meter actually adds up.
              </h2>
            </Reveal>
            <div className="mt-10 divide-y divide-line border-t border-line">
              {RULES.map(({ icon: Icon, title, line }, i) => (
                <Reveal key={title} delay={i * 0.06}>
                  <div className="flex items-start gap-5 py-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-line bg-bg text-text">
                      {Icon && <Icon size={18} />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{line}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <Link
                to="/signup"
                className="mt-10 inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg shadow-[var(--shadow-card)] transition hover:opacity-90 active:translate-y-px"
              >
                Let it park you <ArrowRight size={16} />
              </Link>
            </Reveal>
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
