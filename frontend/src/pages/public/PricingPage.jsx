import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Clock,
  CreditCard,
  Ticket,
  ChevronDown,
} from "lucide-react";
import HeroFadeIn from "../../components/hero/HeroFadeIn";
import { publicApi } from "../../lib/endpoints";
import { isAuthed } from "../../lib/session";

const vnd = new Intl.NumberFormat("vi-VN");
const money = (n) => `${vnd.format(Number(n))}₫`;

const PLANS = [
  {
    name: "Standard Parking",
    price: "Pay per session",
    desc: "Best for drivers who park occasionally and pay only for each parking session.",
    note: "Final cost is calculated by parking duration, vehicle type, and active parking rules.",
    features: [
      "Check in with ticket, QR code, or license plate",
      "AI-assisted slot assignment",
      "Live session tracking",
      "Secure VNPay checkout",
      "Free reservation discount when available",
      "Pay only when you park",
    ],
    cta: "Try ParkMaster",
    to: "/app/reservations",
    highlighted: false,
  },
  {
    name: "Monthly Pass",
    price: "Monthly access",
    desc: "Best for frequent drivers who park regularly and want faster checkout.",
    note: "Pass benefits depend on vehicle type, building, and active pass period.",
    features: [
      "Unlimited or pass-based parking access",
      "Free checkout for active monthly pass vehicles",
      "Faster entry and exit flow",
      "Active pass status in driver dashboard",
      "Supports car and motorbike passes",
      "Avoid repeated session payments",
    ],
    cta: "Try ParkMaster",
    to: "/app/passes",
    highlighted: true,
    badge: "Best for frequent drivers",
  },
];

const VALUES = [
  {
    icon: Zap,
    title: "Faster Slot Assignment",
    line: "Get matched with a practical available slot using ParkMaster\u2019s AI allocation logic.",
  },
  {
    icon: Clock,
    title: "Live Session Tracking",
    line: "Follow your active parking time, status, and estimated cost from the driver dashboard.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    line: "Pay parking fees through a clean checkout flow with VNPay support where enabled.",
  },
  {
    icon: Ticket,
    title: "Monthly Pass Benefits",
    line: "Use active pass status for faster checkout and reduced repeated payment steps.",
  },
];

const FAQS = [
  {
    q: "Can I park without a monthly pass?",
    a: "Yes. Drivers can use standard parking and pay per session based on parking duration and rules.",
  },
  {
    q: "What is a monthly pass for?",
    a: "A monthly pass is designed for frequent drivers who park regularly and want faster checkout or pass-based benefits.",
  },
  {
    q: "Can I reserve a spot before arriving?",
    a: "Yes. ParkMaster supports reservations, including AI-assigned free reservations and paid guaranteed slots when available.",
  },
  {
    q: "How do I pay for parking?",
    a: "Parking payments can be completed through the app using the supported checkout flow, including VNPay where enabled.",
  },
];

function PolicyCard({ policy }) {
  const {
    vehicleTypeName,
    ratePerHour,
    dailyCap,
    graceMinutes,
    peakMultiplier,
    monthlyPassPrice,
  } = policy;
  return (
    <div
      className="rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <div
        className="text-sm font-semibold"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {vehicleTypeName}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className="nums text-3xl font-semibold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {money(ratePerHour)}
        </span>
        <span
          className="text-xs"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          / hour
        </span>
      </div>
      <div
        className="mt-4 space-y-2 border-t pt-4 text-sm"
        style={{ borderColor: "var(--card-border)" }}
      >
        {[
          ["Daily cap", dailyCap ? money(dailyCap) : "None"],
          ["Free grace", `${graceMinutes} min`],
          ["Peak rate", `${peakMultiplier}x`],
          ...(monthlyPassPrice > 0
            ? [["Monthly pass", money(monthlyPassPrice)]]
            : []),
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span style={{ color: "hsl(var(--muted-foreground))" }}>
              {label}
            </span>
            <span className="nums" style={{ color: "hsl(var(--foreground))" }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a, open: defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium transition-colors duration-200 hover:text-white cursor-pointer"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {q}
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "hsl(var(--muted-foreground))" }}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "max-h-40 pb-5" : "max-h-0"
        }`}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV_ITEMS = [
  { label: "Home", target: "/", isRoute: true },
  { label: "Plans", target: "pricing-plans" },
  { label: "Rates", target: "current-rates" },
  { label: "Benefits", target: "driver-benefits" },
  { label: "FAQ", target: "pricing-faq" },
];

export default function PricingPage() {
  const [policies, setPolicies] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("pricing-plans");
  const navigate = useNavigate();

  const goDashboard = () => {
    if (isAuthed()) navigate("/app/dashboard");
    else navigate("/login");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    publicApi
      .pricing()
      .then((p) => { setPolicies(p.filter((x) => x.active)); setPolicyLoading(false); })
      .catch((e) => { setPolicyError(e.message); setPolicyLoading(false); });
  }, []);

  useEffect(() => {
    const SECTION_IDS = ["pricing-plans", "current-rates", "driver-benefits", "pricing-faq"];
    const handleScroll = () => {
      let current = "pricing-plans";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 200) {
          current = id;
        }
      }
      setActiveNav(current);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        "--foreground": "0 0% 96%",
        "--muted-foreground": "0 0% 58%",
        "--card-bg": "rgba(255,255,255,0.04)",
        "--card-border": "rgba(255,255,255,0.07)",
        "--font-display": '"Instrument Serif", serif',
        "--font-body": '"Inter", sans-serif',
        backgroundColor: "hsl(0 0% 4%)",
        color: "hsl(0 0% 96%)",
        fontFamily: '"Inter", sans-serif',
        overflowX: "hidden",
      }}
    >
      {/* ───── Navbar ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center px-4 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
        <div
          className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-3 rounded-2xl sm:rounded-[32px] transition-all duration-500"
          style={{
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 60px rgba(34,211,238,0.03)",
          }}
        >
          <Link
            to="/"
            className="text-2xl tracking-tight no-underline"
            style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}
          >
            ParkMaster
          </Link>
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map(({ label, target, isRoute }) => {
              const isActive = !isRoute && activeNav === target;
              return isRoute ? (
                <Link
                  key={target}
                  to={target}
                  onClick={() => window.scrollTo(0, 0)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/[0.08] no-underline"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={target}
                  onClick={() => scrollTo(target)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/[0.08] cursor-pointer bg-none border-none focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2"
                  style={{
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                    backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-white/[0.12] no-underline"
              style={{
                color: "#ffffff",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Sign in
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:bg-white/[0.08] cursor-pointer bg-none border-none text-white/70"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        {menuOpen && (
          <div
            className="pointer-events-auto mx-auto mt-2 w-full max-w-7xl rounded-2xl border border-white/[0.08] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            style={{
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(20px) saturate(1.8)",
            }}
          >
            {NAV_ITEMS.map(({ label, target, isRoute }) => {
              const isActive = !isRoute && activeNav === target;
              return isRoute ? (
                <Link
                  key={target}
                  to={target}
                  onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }}
                  className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-white/[0.08] no-underline"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={target}
                  onClick={() => { scrollTo(target); setMenuOpen(false); }}
                  className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-white/[0.08] cursor-pointer bg-none border-none text-left"
                  style={{
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                    backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* ───── Hero ───── */}
      <section className="px-6 pt-24 pb-10 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16">
        <HeroFadeIn className="mx-auto max-w-3xl text-center">
          <span
            className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <Sparkles size={12} className="mr-1 inline-block align-text-top" />
            PARKMASTER PRICING
          </span>
          <h1
            className="mt-3 text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
            Simple parking options for every driver.
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Choose standard parking for occasional visits or a monthly pass for
            faster, more convenient parking every day.
          </p>
        </HeroFadeIn>
      </section>

      {/* ───── Pricing cards ───── */}
      <section id="pricing-plans" className="scroll-mt-24 px-6 pb-16 sm:pb-20 md:pb-24">
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2 sm:items-start">
          {PLANS.map((plan, i) => (
            <HeroFadeIn key={plan.name} delay={i * 0.08} y={24}>
              <div
                className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:p-7 ${
                  plan.highlighted
                    ? "border-white/20 bg-white/[0.06] hover:border-white/30 hover:bg-white/[0.08]"
                    : "border-white/[0.07] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] whitespace-nowrap"
                    style={{
                      backgroundColor: "rgba(56,189,248,0.12)",
                      color: "rgba(56,189,248,0.9)",
                      border: "1px solid rgba(56,189,248,0.2)",
                    }}
                  >
                    {plan.badge}
                  </span>
                )}

                <div
                  className="text-base font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {plan.name}
                </div>
                <div
                  className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {plan.price}
                </div>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {plan.desc}
                </p>
                <p
                  className="mt-1 text-xs italic leading-relaxed"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {plan.note}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0"
                        style={{ color: "rgba(56,189,248,0.7)" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.to}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium no-underline transition-all duration-300 hover:-translate-y-[1px] active:scale-[0.97] cursor-pointer ${
                    plan.highlighted
                      ? "bg-white/[0.08] border border-white/25 text-white hover:bg-white/[0.12] hover:border-white/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                      : "bg-white/[0.04] border border-white/[0.12] text-white/80 hover:bg-white/[0.07] hover:border-white/25 hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </HeroFadeIn>
          ))}
        </div>
      </section>

      {/* ───── Current pricing policies (real API) ───── */}
      <section id="current-rates"
        className="scroll-mt-24 border-t px-6 py-16 sm:py-20"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="mx-auto max-w-5xl">
          <HeroFadeIn className="text-center">
            <span
              className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              CURRENT RATES
            </span>
            <h2
              className="mt-2 text-2xl leading-[1.15] tracking-tight sm:text-3xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "hsl(var(--foreground))",
              }}
            >
              Per-vehicle pricing policies.
            </h2>
            <p
              className="mx-auto mt-2 max-w-xl text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Pay by the hour, capped per day. These are the live rates
              configured in the system.
            </p>
          </HeroFadeIn>

          {policyLoading && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-xl border p-5"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--card-bg)",
                  }}
                >
                  <div className="h-4 w-24 rounded bg-white/5" />
                  <div className="mt-4 h-8 w-32 rounded bg-white/5" />
                  <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--card-border)" }}>
                    <div className="h-3.5 w-full rounded bg-white/5" />
                    <div className="h-3.5 w-3/4 rounded bg-white/5" />
                    <div className="h-3.5 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!policyLoading && policyError && (
            <p className="mt-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Unable to load current rates.
            </p>
          )}

          {!policyLoading && !policyError && (!policies || policies.length === 0) && (
            <p className="mt-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No rates configured yet.
            </p>
          )}

          {policies && policies.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {policies.map((p, i) => (
                <HeroFadeIn key={p.vehicleTypeId} delay={i * 0.04} y={12}>
                  <PolicyCard policy={p} />
                </HeroFadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── Value blocks ───── */}
      <section id="driver-benefits"
        className="scroll-mt-24 border-t px-6 py-16 sm:py-20 md:py-24"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="mx-auto max-w-5xl">
          <HeroFadeIn className="text-center">
            <h2
              className="text-2xl leading-[1.15] tracking-tight sm:text-3xl md:text-4xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "hsl(var(--foreground))",
              }}
            >
              Driver benefits built into every parking session.
            </h2>
            <p
              className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              ParkMaster helps drivers reserve faster, follow active sessions,
              pay securely, and use monthly pass benefits without extra friction.
            </p>
          </HeroFadeIn>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, line }, i) => (
              <HeroFadeIn key={title} delay={i * 0.06} y={16}>
                <div
                  className="rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--card-bg)",
                  }}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "var(--card-bg)",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div
                    className="mt-3 text-sm font-semibold"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {title}
                  </div>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {line}
                  </p>
                </div>
              </HeroFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="pricing-faq"
        className="scroll-mt-24 border-t px-6 py-16 sm:py-20"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="mx-auto max-w-2xl">
          <HeroFadeIn className="text-center">
            <h2
              className="text-2xl leading-[1.15] tracking-tight sm:text-3xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "hsl(var(--foreground))",
              }}
            >
              Frequently asked questions.
            </h2>
          </HeroFadeIn>
          <div className="mt-8">
            {FAQS.map((item, i) => (
              <HeroFadeIn key={item.q} delay={i * 0.04} y={12}>
                <FaqItem q={item.q} a={item.a} open={i === 0} />
              </HeroFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section id="contact"
        className="scroll-mt-24 border-t px-6 py-16 sm:py-20 md:py-24"
        style={{ borderColor: "var(--card-border)" }}
      >
        <HeroFadeIn className="mx-auto max-w-3xl text-center">
          <h2
            className="text-2xl leading-[1.15] tracking-tight sm:text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
            Ready to park smarter?
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Reserve a spot, track your session, use your monthly pass, and check
            out faster with ParkMaster.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/app/reservations"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-8 py-3.5 text-sm font-medium text-white no-underline backdrop-blur-md transition-all duration-300 hover:-translate-y-[2px] hover:border-white/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_30px_rgba(56,189,248,0.06)] active:scale-[0.97] cursor-pointer shadow-[0_1px_12px_rgba(0,0,0,0.3)]"
            >
              Reserve now <ArrowRight size={15} />
            </Link>
          </div>
        </HeroFadeIn>
      </section>

      {/* ───── Footer ───── */}
      <footer
        className="border-t px-6 py-10 sm:px-8 sm:py-12"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <div
                className="text-xl font-semibold tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "hsl(var(--foreground))",
                }}
              >
                ParkMaster
              </div>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Parking Building Management System
              </p>
              <p className="mt-2 max-w-[22rem] text-xs leading-relaxed text-white/45">
                Smart parking for drivers, reservations, live sessions, secure
                checkout, and monthly pass access.
              </p>
            </div>
            <div>
              <div className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-white/30">
                Driver
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => scrollTo("pricing-plans")}
                  className="text-[0.8125rem] text-white/55 text-left transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                >
                  Standard Parking
                </button>
                <button
                  onClick={() => scrollTo("pricing-plans")}
                  className="text-[0.8125rem] text-white/55 text-left transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                >
                  Monthly Pass
                </button>
                <button
                  onClick={() => scrollTo("current-rates")}
                  className="text-[0.8125rem] text-white/55 text-left transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                >
                  Current Rates
                </button>
                <button
                  onClick={() => scrollTo("driver-benefits")}
                  className="text-[0.8125rem] text-white/55 text-left transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                >
                  Benefits
                </button>
              </div>
            </div>
            <div>
              <div className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-white/30">
                Navigate
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/"
                  className="text-[0.8125rem] text-white/55 no-underline transition-all duration-200 hover:text-white hover:translate-x-[3px]"
                >
                  Home
                </Link>
                <button
                  onClick={goDashboard}
                  className="text-[0.8125rem] text-white/55 text-left transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                >
                  Dashboard
                </button>
                <Link
                  to="/app/reservations"
                  className="text-[0.8125rem] text-white/55 no-underline transition-all duration-200 hover:text-white hover:translate-x-[3px]"
                >
                  Reservations
                </Link>
              </div>
            </div>
          </div>
          <div
            className="mt-6 border-t pt-5 text-[0.6875rem] text-white/25"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            &copy; 2026 ParkMaster. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
