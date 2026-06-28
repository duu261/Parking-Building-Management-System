import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ScanLine, Smartphone, MessageCircle,
  Sparkles, ArrowRight, BarChart3, Clock,
  CreditCard, Layers, Ticket, Users, QrCode,
  Zap, MapPin, ChevronRight
} from "lucide-react";

import HeroFadeIn from "../../components/hero/HeroFadeIn";
import ScrollMarquee from "../../components/hero/ScrollMarquee";
import SpotlightText from "../../components/hero/SpotlightText";
import { publicApi } from "../../lib/endpoints";

const CRITERIA = [
  { key: "vehicleTypeMatch", label: "Vehicle-type match", max: 40, reason: "it best matches the vehicle type on this floor" },
  { key: "loadBalance", label: "Load balance", max: 30, reason: "it has the best load balance across floors" },
  { key: "distanceToEntry", label: "Distance to entry", max: 20, reason: "it is closest to the building entry" },
  { key: "peakHour", label: "Peak-hour boost", max: 10, reason: "it has the highest peak-hour availability" },
];

function topReason(slot) {
  return CRITERIA.reduce((best, c) =>
    slot[c.key] / c.max > slot[best.key] / best.max ? c : best,
  ).reason;
}

const MARQUEE_ROW_1 = [
  { icon: QrCode, title: "Gate Scan", desc: "License plate, QR, or ticket check-in." },
  { icon: Zap, title: "AI Slot Scoring", desc: "Every open slot ranked in milliseconds." },
  { icon: MapPin, title: "Live Availability", desc: "Buildings, floors, and zones updated in real time." },
  { icon: Ticket, title: "Smart Reservation", desc: "Free AI assignment or paid guaranteed slot." },
  { icon: Layers, title: "Vehicle Elevator", desc: "Automated parking flow for multi-level facilities." },
  { icon: CreditCard, title: "Secure Checkout", desc: "Payments, deposits, discounts, and passes." },
];

const MARQUEE_ROW_2 = [
  { icon: Clock, title: "Monthly Pass", desc: "Fast checkout for subscribed vehicles." },
  { icon: Users, title: "Staff Operations", desc: "Gate staff check vehicles in and out quickly." },
  { icon: BarChart3, title: "Manager Dashboard", desc: "Revenue, occupancy, and allocation performance." },
  { icon: Smartphone, title: "Driver Sessions", desc: "Track active parking sessions from the app." },
  { icon: MessageCircle, title: "Parking Assistant", desc: "Instant answers about pricing and availability." },
  { icon: Layers, title: "Floor Balancing", desc: "Distribute demand across levels automatically." },
];

const FEATURES = [
  {
    num: "01",
    title: "AI Slot Allocation",
    desc: "Scores open slots by vehicle type, floor load, distance to entry, and peak-hour rules to recommend the best available spot.",
  },
  {
    num: "02",
    title: "Reservations",
    desc: "Supports free AI-assigned reservations and paid guaranteed slots for drivers who want certainty before arrival.",
  },
  {
    num: "03",
    title: "Session Tracking",
    desc: "Keeps every check-in, active parking session, checkout time, and parking cost easy to follow.",
  },
  {
    num: "04",
    title: "Payments & Passes",
    desc: "Handles deposits, VNPay checkout, discounts, unpaid charges, and monthly pass benefits in one flow.",
  },
  {
    num: "05",
    title: "Operations Dashboard",
    desc: "Gives managers and staff real-time visibility into buildings, floors, occupancy, revenue, and availability.",
  },
];



const TEAMS = [
  { icon: BarChart3, title: "Operations managers", desc: "Monitor occupancy, revenue, building performance, slot availability, and AI allocation results from one dashboard." },
  { icon: ScanLine, title: "Gate staff", desc: "Check vehicles in and out faster, verify reservations, handle exceptions, and keep entry lanes moving." },
  { icon: CreditCard, title: "Finance teams", desc: "Track deposits, unpaid charges, VNPay payments, discounts, and monthly pass activity with clearer records." },
  { icon: MessageCircle, title: "Customer support", desc: "Help drivers with reservations, assigned slots, active sessions, payments, and parking questions using real-time data." },
];

/* ───── Sections ───── */

function ParkingFlowMarqueeSection() {
  return (
    <section id="parking-flow" className="overflow-hidden px-6 pb-12 pt-20 sm:pt-28 md:pt-32 scroll-mt-24">
      <HeroFadeIn className="mx-auto mb-10 max-w-4xl text-center">
        <span className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Parking flow</span>
        <h2 className="text-2xl md:text-4xl leading-[1.15] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>One parking journey. Fully connected.</h2>
        <p className="text-sm leading-[1.65] mx-auto mt-2 max-w-2xl" style={{ color: "hsl(var(--muted-foreground))" }}>
          From arrival and AI slot assignment to session tracking and secure checkout, ParkMaster keeps every step moving.
        </p>
      </HeroFadeIn>

      <div style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
          overflowX: 'hidden',
          overflowY: 'visible',
        }} className="space-y-4 sm:space-y-5 py-3">
        <ScrollMarquee direction="right" speed={0.12}>
          {MARQUEE_ROW_1.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="w-[280px] h-[150px] sm:w-[310px] sm:h-[165px] rounded-[20px] border border-white/10 bg-white/[0.04] p-4 sm:px-5 sm:py-[1.125rem] flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] shrink-0">
              <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[10px] border border-white/10 bg-white/[0.04] mb-2"><Icon size={15} /></span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </ScrollMarquee>
        <ScrollMarquee direction="left" speed={0.1}>
          {MARQUEE_ROW_2.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="w-[280px] h-[150px] sm:w-[310px] sm:h-[165px] rounded-[20px] border border-white/10 bg-white/[0.04] p-4 sm:px-5 sm:py-[1.125rem] flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] shrink-0">
              <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[10px] border border-white/10 bg-white/[0.04] mb-2"><Icon size={15} /></span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </ScrollMarquee>
      </div>
    </section>
  );
}

function SmartParkingAboutSection() {
  const STATS = [
    { label: "Open slots", value: "39/46" },
    { label: "AI score", value: "88/100" },
    { label: "Payment", value: "VNPay" },
    { label: "Pass status", value: "Active" },
  ];

  return (
    <section id="about-parkmaster" className="overflow-x-clip px-5 py-20 sm:px-8 md:px-10 md:py-28 scroll-mt-24">
      <div className="mx-auto max-w-5xl">
        <HeroFadeIn className="mx-auto max-w-4xl text-center">
          <span className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>About ParkMaster</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl leading-[1.15] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
            Built for smarter parking buildings.
          </h2>

          <div className="mx-auto mt-6 max-w-3xl">
            <SpotlightText
              text="ParkMaster connects drivers, staff, managers, and AI assistance in one parking workflow. Drivers find a spot faster, staff handle gates with less friction, and managers see availability, revenue, and occupancy clearly. The system keeps every parking session organized from entry to checkout"
              className="text-base leading-relaxed sm:text-lg"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
          </div>

          <HeroFadeIn delay={0.3}>
            <button onClick={() => scrollTo("core-features")} className="group mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm text-[hsl(var(--foreground))] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card-bg)" }}>
              Explore PBMS features <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </HeroFadeIn>
        </HeroFadeIn>

        {/* Stats grid */}
        <HeroFadeIn delay={0.2} className="mt-12">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border px-4 py-3.5 text-center backdrop-blur-sm sm:px-5 sm:py-4" style={{ borderColor: "var(--card-border)", backgroundColor: "rgba(0,0,0,0.35)" }}>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</div>
                <div className="text-base font-semibold tracking-[-0.02em] nums mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </HeroFadeIn>
      </div>
    </section>
  );
}

function PBMSFeaturesSection() {
  return (
    <section id="core-features" className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-20 md:px-10 md:py-28 scroll-mt-24">
      {/* Video background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 z-0 h-full w-full object-cover">
        <source src="/videos/parking.mp4" type="video/mp4" />
      </video>
      {/* Cinematic overlay — darker edges, vignette sides */}
      <div className="absolute inset-0 z-[1]" style={{
        background: `
          radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 100%),
          linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.75) 100%)
        `
      }} />

      <div className="relative z-10 mx-auto max-w-5xl">
        <HeroFadeIn>
          <span className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.7)" }}>Core features</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl" style={{
            fontFamily: "var(--font-display)",
            color: "#ffffff",
            textShadow: "0 1px 12px rgba(0,0,0,0.5)",
          }}>
            Core features
          </h2>
        </HeroFadeIn>

        <div className="mt-10 sm:mt-14">
          {FEATURES.map((f, i) => (
            <HeroFadeIn key={f.num} delay={i * 0.08} y={20}>
              <div className="group flex flex-col sm:flex-row gap-2 sm:gap-6 border-t border-white/10 py-6 sm:py-8 transition-all duration-[0.35s] ease relative pl-0 hover:pl-8 hover:bg-white/[0.03] hover:rounded-lg hover:-mx-3 hover:px-3">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-[2px] bg-[hsl(186,70%,45%)] opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-100 transition-all duration-[0.35s] ease origin-top pointer-events-none" />
                <span className="text-4xl sm:text-[5.5rem] font-[200] leading-none tracking-[-0.04em] text-white/15 nums transition-colors duration-300 group-hover:text-white/30 shrink-0">{f.num}</span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight transition-colors duration-300 sm:text-lg group-hover:text-white" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {f.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed group-hover:text-white/70 transition-colors duration-300" style={{ color: "rgba(255,255,255,0.62)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </HeroFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIAllocationShowcaseSection() {
  const [buildings, setBuildings] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [buildingId, setBuildingId] = useState(null);
  const [vehicleTypeId, setVehicleTypeId] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState([]);

  /* ── Fetch buildings + pricing on mount ── */
  useEffect(() => {
    let cancelled = false;
    Promise.all([publicApi.buildings(), publicApi.pricing()]).then(([b, p]) => {
      if (cancelled) return;
      setBuildings(b);
      const types = [...new Map(p.map((t) => [t.vehicleTypeId, t])).values()];
      setVehicleTypes(types);
      if (b.length) setBuildingId(b[0].id);
      if (types.length) setVehicleTypeId(types[0].vehicleTypeId);
    }).catch(() => { if (!cancelled) setError("Failed to load buildings"); });
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch allocation preview when building or vehicle changes ── */
  useEffect(() => {
    if (!buildingId || !vehicleTypeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicApi.allocationPreview(buildingId, vehicleTypeId, 6)
      .then((data) => { if (!cancelled) setRanked(data); })
      .catch(() => { if (!cancelled) setError("Failed to load allocation"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildingId, vehicleTypeId]);

  /* ── Fetch availability for all buildings ── */
  useEffect(() => {
    if (!buildings.length) return;
    let cancelled = false;
    Promise.all(buildings.map((b) => publicApi.availability(b.id)))
      .then((results) => {
        if (!cancelled) setAvailability(results);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [buildings]);

  const winner = ranked[0];
  const runners = ranked.slice(1);

  const activeVehicleName = vehicleTypes.find((t) => t.vehicleTypeId === vehicleTypeId)?.vehicleTypeName ?? "Car";

  return (
    <section id="ai-allocation" className="rounded-b-[32px] px-5 py-20 sm:rounded-b-[40px] sm:px-8 sm:py-24 md:rounded-b-[48px] md:px-10 md:py-28 scroll-mt-24">
      <HeroFadeIn className="mx-auto mb-10 max-w-4xl text-center">
        <span className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          <Sparkles size={13} className="mr-1 inline-block align-text-top" />
          LIVE AI SLOT ALLOCATION
        </span>
        <h2 className="text-2xl md:text-4xl leading-[1.15] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>Where should this car park? The AI answers in milliseconds.</h2>
        <p className="text-sm leading-[1.65] mx-auto mt-2 max-w-3xl" style={{ color: "hsl(var(--muted-foreground))" }}>
          Switch the vehicle type and watch every open slot get re-scored on four weighted criteria, best first. This is the live engine, no login required.
        </p>
      </HeroFadeIn>

      {/* Selectors */}
      <div className="mx-auto mb-10 max-w-6xl">
        <HeroFadeIn delay={0.05}>
          <div className="flex flex-wrap items-start gap-8 sm:gap-12">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Building</div>
              <div className="flex flex-wrap gap-2">
                {buildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBuildingId(b.id)}
                    className={buildingId === b.id ? "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] rounded-full border border-white/80 bg-white/[0.08] text-white px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white hover:bg-white/[0.12] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]" : "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Vehicle type</div>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((t) => (
                  <button
                    key={t.vehicleTypeId}
                    onClick={() => setVehicleTypeId(t.vehicleTypeId)}
                    className={vehicleTypeId === t.vehicleTypeId ? "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] rounded-full border border-white/80 bg-white/[0.08] text-white px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white hover:bg-white/[0.12] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]" : "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"}
                  >
                    {t.vehicleTypeName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </HeroFadeIn>
      </div>

      {/* Loading / Error / Main content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      )}

      {error && (
        <p className="py-20 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{error}</p>
      )}

      {!loading && !error && winner && (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* AI pick card */}
          <HeroFadeIn delay={0.15} className="h-fit">
            <div className="rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 sm:rounded-3xl sm:p-8" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card-bg)" }}>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "hsl(var(--foreground))" }}>
                <Sparkles size={12} /> AI PICK FOR {activeVehicleName.toUpperCase()}
              </span>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "hsl(var(--foreground))" }}>{winner.slotCode}</div>
                  <div className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {winner.floorName} &middot; Level {winner.level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>{winner.total}</div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>SCORE / 100</div>
                </div>
              </div>

              <p className="mt-4 border-t pt-4 text-sm leading-relaxed sm:mt-5 sm:pt-5" style={{ borderColor: "var(--card-border)", color: "hsl(var(--foreground))" }}>
                Won because {topReason(winner)}.
              </p>

              {/* Criteria bars */}
              <div className="mt-5 space-y-3">
                {CRITERIA.map((c) => {
                  const val = winner[c.key] ?? 0;
                  const pct = Math.min(100, (val / c.max) * 100);
                  return (
                    <div key={c.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>{c.label}</span>
                        <span className="nums" style={{ color: "hsl(var(--foreground))" }}>{val}/{c.max}</span>
                      </div>
                      <div className="h-[5px] rounded-[2.5px] bg-white/[0.05] overflow-hidden mt-1.5">
                        <div className="h-full rounded-[2.5px] bg-gradient-to-r from-[hsl(186,70%,45%)] to-[rgba(56,189,248,0.25)] transition-all duration-[0.6s] ease" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </HeroFadeIn>

          {/* Runners-up + CTA */}
          <div>
            <HeroFadeIn delay={0.2}>
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Runners-up</div>
              <div className="mt-3 divide-y" style={{ borderColor: "var(--card-border)" }}>
                {runners.map((r, i) => (
                  <div key={r.slotCode} className="flex items-center gap-3 py-2.5 text-sm transition-all duration-200 hover:pl-1">
                    <span className="nums w-5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{i + 2}</span>
                    <span className="nums font-medium" style={{ color: "hsl(var(--foreground))" }}>{r.slotCode}</span>
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{r.floorName}</span>
                    <span className="nums ml-auto text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{r.total}</span>
                  </div>
                ))}
              </div>
            </HeroFadeIn>

            <HeroFadeIn delay={0.3}>
              <Link to="/app/reservations" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white no-underline transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] mt-6">
                Let it park you <ArrowRight size={15} className="inline-block transition-all duration-300 opacity-70 group-hover:translate-x-[3px] group-hover:opacity-100" />
              </Link>
            </HeroFadeIn>
          </div>
        </div>
      )}

      {/* Live availability */}
      <div id="availability" />
      <HeroFadeIn delay={0.2} className="mx-auto mt-16 max-w-6xl">
        <div className="mb-4 text-center">
          <div className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Live availability</div>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Real-time open slots across all buildings.</p>
        </div>
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          {availability.map((a) => {
            const pct = a.totalSlots > 0 ? Math.round((a.availableSlots / a.totalSlots) * 100) : 0;
            return (
              <div key={a.buildingId} className="rounded-xl border p-5 backdrop-blur-sm" style={{ borderColor: "var(--card-border)", backgroundColor: "rgba(0,0,0,0.35)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{a.name}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Open slots</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>{a.availableSlots}/{a.totalSlots}</div>
                  </div>
                </div>
                <div className="h-[5px] rounded-[2.5px] bg-white/[0.05] overflow-hidden mt-3">
                  <div className="h-full rounded-[2.5px] bg-gradient-to-r from-[hsl(186,70%,45%)] to-[rgba(56,189,248,0.25)] transition-all duration-[0.6s] ease" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </HeroFadeIn>
    </section>
  );
}

function ParkingRolesSection() {
  return (
    <section id="for-teams" className="border-t px-6 py-16 sm:py-24 scroll-mt-24" style={{ borderColor: "var(--card-border)" }}>
      <div className="mx-auto max-w-5xl">
        <HeroFadeIn className="text-center">
          <h2 className="text-2xl md:text-4xl leading-[1.15] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
            For teams running modern parking buildings.
          </h2>
          <p className="text-sm leading-[1.65] mx-auto mt-2 max-w-2xl" style={{ color: "hsl(var(--muted-foreground))" }}>
            ParkMaster gives managers, gate staff, finance teams, and support staff one shared system to handle parking operations from entry to checkout.
          </p>
        </HeroFadeIn>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {TEAMS.map(({ icon: Icon, title, desc }, i) => (
            <HeroFadeIn key={title} delay={i * 0.08}>
              <div className="group h-full rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card-bg)" }}>
                <span className="flex size-10 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:border-white/25" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card-bg)", color: "hsl(var(--foreground))" }}>
                  <Icon size={18} />
                </span>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
                </div>
              </div>
            </HeroFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section id="pricing" className="border-t px-6 py-20 sm:py-28 scroll-mt-24" style={{ borderColor: "var(--card-border)" }}>
      <HeroFadeIn className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl leading-[1.15] tracking-tight" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
          Ready to make parking feel effortless?
        </h2>
        <p className="text-sm leading-[1.65] mx-auto mt-3 max-w-xl" style={{ color: "hsl(var(--muted-foreground))" }}>
          Use ParkMaster to connect reservations, AI slot allocation, live availability, sessions, payments, and operations in one system.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/app/dashboard" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_30px_rgba(56,189,248,0.06)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-white/[0.06] backdrop-blur-md border border-white/20 shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
            Open Dashboard <ArrowRight size={15} />
          </Link>
          <button onClick={() => scrollTo("ai-allocation")} className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white/70 no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-transparent border border-white/20">
            See AI Allocation
          </button>
        </div>
      </HeroFadeIn>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.015] to-white/[0.005] px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="text-xl font-semibold tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>ParkMaster</div>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Parking Building Management System</p>
            <p className="text-xs leading-relaxed text-white/45 mt-2 max-w-[22rem]">Smart parking operations for modern buildings &mdash; AI allocation, live availability, reservations, and secure checkout.</p>
          </div>
          {/* Navigation */}
          <div>
            <div className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">Navigate</div>
            <div className="flex flex-col gap-3">
              <Link to="/app/dashboard" className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Dashboard</Link>
              <Link to="/app/reservations" className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Reservations</Link>
              <button onClick={() => scrollTo("pricing")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Pricing</button>
              <button onClick={() => scrollTo("contact")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Contact</button>
            </div>
          </div>
          {/* Product */}
          <div>
            <div className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">Product</div>
            <div className="flex flex-col gap-3">
              <button onClick={() => scrollTo("ai-allocation")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">AI Allocation</button>
              <button onClick={() => scrollTo("parking-flow")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Parking Flow</button>
              <button onClick={() => scrollTo("core-features")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">Core Features</button>
              <button onClick={() => scrollTo("for-teams")} className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm">For teams</button>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <div className="text-[0.6875rem] text-white/25 border-t border-white/[0.06] pt-5 mt-6">
          &copy; {year} ParkMaster. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ───── Page ───── */

const NAV_ITEMS = [
  { label: "Home", target: "hero-home" },
  { label: "Flow", target: "parking-flow" },
  { label: "About", target: "about-parkmaster" },
  { label: "Features", target: "core-features" },
  { label: "AI Allocation", target: "ai-allocation" },
  { label: "Availability", target: "availability" },
  { label: "For Teams", target: "for-teams" },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState("hero-home");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add("hero-scroll");
    return () => document.documentElement.classList.remove("hero-scroll");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback((target) => {
    setActiveNav(target);
    scrollTo(target);
  }, []);

  return (
    <div style={{
        '--foreground': '0 0% 96%',
        '--muted-foreground': '0 0% 58%',
        '--card-bg': 'rgba(255,255,255,0.04)',
        '--card-border': 'rgba(255,255,255,0.07)',
        '--font-display': '"Instrument Serif", serif',
        '--font-body': '"Inter", sans-serif',
        backgroundColor: 'hsl(0 0% 4%)',
        color: 'hsl(0 0% 96%)',
        fontFamily: '"Inter", sans-serif',
        overflowX: 'hidden',
      }}>
      <style>{`
        html.hero-scroll::-webkit-scrollbar { display: none; }
        html.hero-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Scroll progress indicator */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block pointer-events-none">
        <div className="relative h-48 w-[3px] rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-white/80 via-white/50 to-white/30 transition-all duration-150 ease-out"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* ───── Hero fullscreen ───── */}
      <section id="hero-home" className="relative min-h-screen overflow-hidden scroll-mt-24">
        {/* Cinematic gradient overlay — darker at edges, brighter center for readability */}
        <div className="absolute inset-0 z-[1]" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.55) 100%)
          `
        }} />
        <video autoPlay loop muted playsInline className="absolute inset-0 z-0 h-full w-full object-cover">
          <source src="/videos/parking-hero.mp4" type="video/mp4" />
        </video>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <span className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)", color: "#ffffff", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            ParkMaster
          </span>
          <div className="hidden items-center gap-4 md:flex">
            {NAV_ITEMS.map(({ label, target }) => (
              <button
                key={target}
                onClick={() => handleNavClick(target)}
                className="text-sm font-medium transition-colors duration-200 hover:text-white cursor-pointer bg-none border-none p-0 focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
                style={{
                  color: activeNav === target ? "#ffffff" : "rgba(255,255,255,0.6)",
                  textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link to="/login" className="cursor-pointer rounded-full px-6 py-2.5 text-sm font-medium transition-transform hover:scale-[1.03]" style={{
            color: "#ffffff",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 1px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.15)",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}>
            Sign in
          </Link>
        </nav>

        <div className="relative z-10 flex flex-col items-center px-6 pb-40 pt-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-7xl text-5xl leading-[0.95] tracking-[-2.46px] sm:text-7xl md:text-8xl"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              color: "#ffffff",
              textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            Smart{" "}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>parking</span>
            , from{" "}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>entry to checkout</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{
              color: "rgba(255,255,255,0.8)",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            ParkMaster helps drivers reserve spaces, enter faster, track active sessions, and pay securely. For operators, PBMS brings AI slot allocation, real-time availability, monthly passes, and parking insights into one clean system.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/app/reservations" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_30px_rgba(56,189,248,0.06)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-white/[0.06] backdrop-blur-md border border-white/20 shadow-[0_1px_12px_rgba(0,0,0,0.3)] px-12 py-4 text-base">
              Reserve your spot
            </Link>
            <button onClick={() => scrollTo("ai-allocation")} className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white/70 no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-transparent border border-white/20 px-7 py-4 text-base">
              See AI allocation
            </button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-5 text-xs tracking-wide"
            style={{
              color: "rgba(255,255,255,0.65)",
              textShadow: "0 1px 6px rgba(0,0,0,0.4)",
            }}
          >
            AI-assisted allocation &middot; Live availability &middot; Secure checkout
          </motion.p>
        </div>
      </section>

      <ParkingFlowMarqueeSection />
      <SmartParkingAboutSection />
      <PBMSFeaturesSection />
      <AIAllocationShowcaseSection />
      <ParkingRolesSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
