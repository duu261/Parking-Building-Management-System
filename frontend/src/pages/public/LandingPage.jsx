import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ScanLine,
  Smartphone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  Layers,
  Ticket,
  Users,
  QrCode,
  Zap,
  MapPin,
  ChevronRight,
  Trophy,
} from "lucide-react";

import HeroFadeIn from "../../components/hero/HeroFadeIn";

import SpotlightText from "../../components/hero/SpotlightText";
import { publicApi } from "../../lib/endpoints";

const CRITERIA = [
  {
    key: "vehicleTypeMatch",
    label: "Vehicle-type match",
    max: 40,
    reason: "it best matches the vehicle type on this floor",
    description: "Matches the slot floor with the selected vehicle type. Mixed floors receive a partial score.",
    short: "Vehicle Type Match",
  },
  {
    key: "loadBalance",
    label: "Load balance",
    max: 30,
    reason: "it has the best load balance across floors",
    description: "Prefers floors with more available spaces to distribute demand evenly across the building.",
    short: "Load Balance",
  },
  {
    key: "distanceToEntry",
    label: "Distance to entry",
    max: 20,
    reason: "it is closest to the building entry",
    description: "Lower floors score higher because they are closer to the entry flow.",
    short: "Distance to Entry",
  },
  {
    key: "peakHour",
    label: "Peak-hour boost",
    max: 10,
    reason: "it has the highest peak-hour availability",
    description: "During 7\u20139AM and 5\u20137PM, ParkMaster spreads vehicles across floors with more capacity.",
    short: "Peak Hour Balance",
  },
];

function topReason(slot) {
  return CRITERIA.reduce((best, c) =>
    slot[c.key] / c.max > slot[best.key] / best.max ? c : best,
  ).reason;
}

const MARQUEE_ROW_1 = [
  {
    icon: QrCode,
    title: "Gate Scan",
    desc: "License plate, QR, or ticket check-in.",
  },
  {
    icon: Zap,
    title: "AI Slot Scoring",
    desc: "Every open slot ranked in milliseconds.",
  },
  {
    icon: MapPin,
    title: "Live Availability",
    desc: "Buildings, floors, and zones updated in real time.",
  },
  {
    icon: Ticket,
    title: "Smart Reservation",
    desc: "Free AI assignment or paid guaranteed slot.",
  },
  {
    icon: Layers,
    title: "Vehicle Elevator",
    desc: "Automated parking flow for multi-level facilities.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    desc: "Payments, deposits, discounts, and passes.",
  },
];

const MARQUEE_ROW_2 = [
  {
    icon: Clock,
    title: "Monthly Pass",
    desc: "Fast checkout for subscribed vehicles.",
  },
  {
    icon: Users,
    title: "Staff Operations",
    desc: "Gate staff check vehicles in and out quickly.",
  },
  {
    icon: BarChart3,
    title: "Manager Dashboard",
    desc: "Revenue, occupancy, and allocation performance.",
  },
  {
    icon: Smartphone,
    title: "Driver Sessions",
    desc: "Track active parking sessions from the app.",
  },
  {
    icon: MessageCircle,
    title: "Parking Assistant",
    desc: "Instant answers about pricing and availability.",
  },
  {
    icon: Layers,
    title: "Floor Balancing",
    desc: "Distribute demand across levels automatically.",
  },
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
  {
    icon: BarChart3,
    title: "Operations managers",
    desc: "Monitor occupancy, revenue, building performance, slot availability, and AI allocation results from one dashboard.",
  },
  {
    icon: ScanLine,
    title: "Gate staff",
    desc: "Check vehicles in and out faster, verify reservations, handle exceptions, and keep entry lanes moving.",
  },
  {
    icon: CreditCard,
    title: "Finance teams",
    desc: "Track deposits, unpaid charges, VNPay payments, discounts, and monthly pass activity with clearer records.",
  },
  {
    icon: MessageCircle,
    title: "Customer support",
    desc: "Help drivers with reservations, assigned slots, active sessions, payments, and parking questions using real-time data.",
  },
];

/* ───── Sections ───── */

function ParkingFlowCard({ icon: Icon, title, desc }) {
  return (
    <div className="w-[260px] sm:w-[300px] h-[150px] sm:h-[165px] rounded-[20px] border border-white/10 bg-white/[0.04] p-4 sm:px-5 sm:py-[1.125rem] flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] shrink-0">
      <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[10px] border border-white/10 bg-white/[0.04] mb-2">
        <Icon size={15} />
      </span>
      <h3
        className="text-sm font-semibold sm:text-base"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {title}
      </h3>
      <p
        className="text-xs sm:text-sm leading-relaxed mt-0.5"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {desc}
      </p>
    </div>
  );
}

function ParkingFlowMarqueeSection() {
  const sectionRef = useRef(null);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const [offset1, setOffset1] = useState(-300);
  const [offset2, setOffset2] = useState(0);

  const handleScroll = useCallback(() => {
    const el = sectionRef.current;
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;
    if (!el || !r1 || !r2) return;

    const rect = el.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const raw = (window.scrollY - sectionTop + window.innerHeight) * 0.06;

    const hw1 = r1.scrollWidth / 3;
    const hw2 = r2.scrollWidth / 3;

    setOffset1(-hw1 + (raw % hw1));
    setOffset2(-(raw % hw2));
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const row1Cards = [...MARQUEE_ROW_1, ...MARQUEE_ROW_1, ...MARQUEE_ROW_1];
  const row2Cards = [...MARQUEE_ROW_2, ...MARQUEE_ROW_2, ...MARQUEE_ROW_2];
  const allCards = [...MARQUEE_ROW_1, ...MARQUEE_ROW_2];

  return (
    <section
      id="parking-flow"
      ref={sectionRef}
      className="overflow-hidden px-6 pb-6 pt-20 sm:pt-28 md:pt-32 scroll-mt-24"
    >
      <HeroFadeIn className="mx-auto mb-8 max-w-4xl text-center">
        <span
          className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Parking flow
        </span>
        <h2
          className="text-2xl md:text-4xl leading-[1.15] tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "hsl(var(--foreground))",
          }}
        >
          One parking journey. Fully connected.
        </h2>
        <p
          className="text-sm leading-[1.65] mx-auto mt-2 max-w-2xl"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          From arrival and AI slot assignment to session tracking and secure
          checkout, ParkMaster keeps every step moving.
        </p>
      </HeroFadeIn>

      {/* Desktop marquee rows */}
      <div className="hidden sm:block">
        <div className="overflow-hidden">
          <div
            ref={row1Ref}
            className="flex gap-4"
            style={{
              transform: `translateX(${offset1}px)`,
              willChange: "transform",
            }}
          >
            {row1Cards.map((card, i) => (
              <ParkingFlowCard key={`r1-${i}`} {...card} />
            ))}
          </div>
        </div>
        <div className="h-4" />
        <div className="overflow-hidden">
          <div
            ref={row2Ref}
            className="flex gap-4"
            style={{
              transform: `translateX(${offset2}px)`,
              willChange: "transform",
            }}
          >
            {row2Cards.map((card, i) => (
              <ParkingFlowCard key={`r2-${i}`} {...card} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile grid */}
      <div className="sm:hidden grid grid-cols-2 gap-3 px-1">
        {allCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3.5 flex flex-col transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06]"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] border border-white/10 bg-white/[0.04] mb-2">
              <card.icon size={13} />
            </span>
            <h3
              className="text-xs font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {card.title}
            </h3>
            <p
              className="text-[0.65rem] leading-relaxed mt-0.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmartParkingAboutSection() {
  const STATS = [
    { label: "Deployment", value: "Cloud-native" },
    { label: "Hardware", value: "Agnostic" },
    { label: "Analytics", value: "Real-time" },
    { label: "Security", value: "End-to-end" },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section
      id="about-parkmaster"
      className="overflow-x-clip px-5 py-20 sm:px-8 md:px-10 md:py-28 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl">
        <HeroFadeIn className="mx-auto max-w-4xl text-center">
          <span
            className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            About ParkMaster
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl leading-[1.15] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
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
            <button
              onClick={() => scrollTo("core-features")}
              className="group mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm text-[hsl(var(--foreground))] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              Explore PBMS features{" "}
              <ChevronRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </button>
          </HeroFadeIn>
        </HeroFadeIn>

        {/* Stats grid */}
        <motion.div
          className="mt-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={itemVariants}
                className="rounded-xl border px-4 py-3.5 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:px-5 sm:py-4"
                style={{
                  borderColor: "var(--card-border)",
                  backgroundColor: "rgba(0,0,0,0.35)",
                }}
              >
                <div
                  className="text-xs font-medium uppercase tracking-[0.08em]"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {s.label}
                </div>
                <div className="text-base font-semibold tracking-[-0.02em] nums mt-0.5">
                  {s.value}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PBMSFeaturesSection() {
  return (
    <section
      id="core-features"
      className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-20 md:px-10 md:py-28 scroll-mt-24"
    >
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src="/videos/parking.mp4" type="video/mp4" />
      </video>
      {/* Cinematic overlay — darker edges, vignette sides */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `
          radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 100%),
          linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.75) 100%)
        `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <HeroFadeIn>
          <span
            className="text-xs font-medium uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Core features
          </span>
          <h2
            className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "#ffffff",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            Core features
          </h2>
        </HeroFadeIn>

        <div className="mt-10 sm:mt-14">
          {FEATURES.map((f, i) => (
            <HeroFadeIn key={f.num} delay={i * 0.08} y={20}>
              <div className="group flex flex-col sm:flex-row gap-2 sm:gap-6 border-t border-white/10 py-6 sm:py-8 transition-all duration-[0.35s] ease relative pl-0 hover:pl-8 hover:bg-white/[0.03] hover:rounded-lg hover:-mx-3 hover:px-3">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-[2px] bg-[hsl(186,70%,45%)] opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-100 transition-all duration-[0.35s] ease origin-top pointer-events-none" />
                <span className="text-4xl sm:text-[5.5rem] font-[200] leading-none tracking-[-0.04em] text-white/15 nums transition-colors duration-300 group-hover:text-white/30 shrink-0">
                  {f.num}
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-base font-semibold tracking-tight transition-colors duration-300 sm:text-lg group-hover:text-white"
                    style={{ color: "rgba(255,255,255,0.92)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="mt-1 max-w-2xl text-sm leading-relaxed group-hover:text-white/70 transition-colors duration-300"
                    style={{ color: "rgba(255,255,255,0.62)" }}
                  >
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
  const [hasVideo, setHasVideo] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(null);

  /* Detect video asset */
  useEffect(() => {
    const v = document.createElement('video');
    v.oncanplaythrough = () => setHasVideo(true);
    v.onerror = () => setHasVideo(false);
    v.src = '/videos/allocation.mp4';
    v.load();
    return () => { v.oncanplaythrough = null; v.onerror = null; };
  }, []);

  /* ── Fetch buildings + pricing on mount ── */
  useEffect(() => {
    let cancelled = false;
    Promise.all([publicApi.buildings(), publicApi.pricing()])
      .then(([b, p]) => {
        if (cancelled) return;
        setBuildings(b);
        const types = [...new Map(p.map((t) => [t.vehicleTypeId, t])).values()];
        setVehicleTypes(types);
        if (b.length) setBuildingId(b[0].id);
        if (types.length) setVehicleTypeId(types[0].vehicleTypeId);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load buildings");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Fetch allocation preview when building or vehicle changes ── */
  useEffect(() => {
    if (!buildingId || !vehicleTypeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicApi
      .allocationPreview(buildingId, vehicleTypeId, 6)
      .then((data) => {
        if (!cancelled) setRanked(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load allocation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
  }, [buildings]);

  const winner = ranked[0];
  const runners = ranked.slice(1);

  const activeVehicleName =
    vehicleTypes.find((t) => t.vehicleTypeId === vehicleTypeId)
      ?.vehicleTypeName ?? "Car";

  return (
    <section
      id="ai-allocation"
      className="relative overflow-x-clip px-5 py-20 sm:px-8 sm:py-24 md:px-10 md:py-28 scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ── 1. Header ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/4 blur-[120px]" />
          <div className="absolute right-1/3 top-1/2 h-[300px] w-[300px] rounded-full bg-teal-500/4 blur-[100px]" />
        </div>

        <HeroFadeIn className="relative mx-auto mb-16 max-w-4xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-[0.12em] uppercase" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Sparkles size={13} className="inline-block" />
            AI ALLOCATION ENGINE
          </span>
          <h2
            className="text-3xl leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
            ParkMaster scores, ranks, and assigns the best slot in milliseconds
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            A weighted scoring engine scans available slots, evaluates each candidate, sorts the results, and recommends the highest-scoring parking space.
          </p>
        </HeroFadeIn>

        <div className="relative mx-auto mb-20 w-full max-w-[1500px] px-4 sm:px-6">


          {/* ── Mobile layout (< lg) — stacked ── */}
          <div className="flex flex-col gap-6 lg:hidden">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] shadow-[0_0_50px_rgba(34,211,238,0.04)]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
                <div className="absolute left-3 top-3 z-20 h-6 w-6 rounded-tl border-l-[1.5px] border-t-[1.5px] border-cyan-400/30" />
                <div className="absolute right-3 top-3 z-20 h-6 w-6 rounded-tr border-r-[1.5px] border-t-[1.5px] border-cyan-400/30" />
                <div className="absolute bottom-3 left-3 z-20 h-6 w-6 rounded-bl border-b-[1.5px] border-l-[1.5px] border-cyan-400/30" />
                <div className="absolute bottom-3 right-3 z-20 h-6 w-6 rounded-br border-b-[1.5px] border-r-[1.5px] border-cyan-400/30" />
                <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                  </span>
                  <span className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-white/80">Live scan feed</span>
                </div>
                <video className="h-full w-full object-cover" src="/videos/scan-parking.mp4" autoPlay muted defaultMuted loop playsInline preload="metadata" style={{ aspectRatio: "16 / 9" }} />
              </div>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[{ step: "01", icon: ScanLine, title: "Scan available slots", desc: "ParkMaster reads every available slot in the selected building before scoring candidates.", highlight: false }, { step: "02", icon: BarChart3, title: "Score each candidate", desc: "Each slot is scored using four weighted criteria per slot.", highlight: false }, { step: "03", icon: Layers, title: "Rank best-first", desc: "Top candidates sorted by total score descending.", highlight: false }, { step: "04", icon: Trophy, title: "Assign the top slot", desc: "Highest score wins the recommendation as the best available spot.", highlight: true }].map((card, i) => (
                <motion.div key={card.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} onMouseEnter={() => setHoveredStep(card.step)} onMouseLeave={() => setHoveredStep(null)}
                  className={card.highlight ? "group relative rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/8 to-white/[0.02] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_8px_40px_rgba(34,211,238,0.1)] sm:p-6" : "group relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] sm:p-6"}
                >
                  <span className={card.highlight ? "pointer-events-none absolute right-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-cyan-400/10 sm:text-[4.5rem]" : "pointer-events-none absolute right-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-white/[0.04] sm:text-[4.5rem]"}>{card.step}</span>
                  <div className="relative">
                    <span className={card.highlight ? "flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-400 transition-all duration-300 group-hover:bg-cyan-400/15 sm:h-12 sm:w-12" : "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.06] sm:h-12 sm:w-12"}>
                      <card.icon size={card.highlight ? 22 : 20} />
                    </span>
                    <h4 className={card.highlight ? "mt-3 text-sm font-semibold text-cyan-300 sm:text-base" : "mt-3 text-sm font-semibold text-white sm:text-base"}>{card.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-sm">{card.desc}</p>
                    {card.highlight && <div className="mt-3 h-[2px] w-12 rounded-full bg-gradient-to-r from-cyan-400 to-transparent" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Desktop layout (>= lg) — 3-column grid: left cards / center video / right cards ── */}
          <div className="relative hidden lg:block">
            <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:gap-x-8">

              {/* Left column — Card 01 + Card 03 */}
              <div className="flex flex-col justify-between gap-6 h-full">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredStep("01")}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="w-full max-w-[280px] rounded-3xl border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <span className="pointer-events-none absolute left-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-white/[0.04]">01</span>
                  <div className="relative">
                    <div className="flex justify-end">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70"><ScanLine size={20} /></span>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-white">Scan available slots</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">ParkMaster reads every available slot in the selected building before scoring candidates.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredStep("03")}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="w-full max-w-[280px] rounded-3xl border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <span className="pointer-events-none absolute left-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-white/[0.04]">03</span>
                  <div className="relative">
                    <div className="flex justify-end">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70"><Layers size={20} /></span>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-white">Rank best-first</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">Top candidates sorted by total score descending.</p>
                  </div>
                </motion.div>
              </div>

              {/* Center column — video */}
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-white/[0.03] shadow-[0_0_90px_rgba(34,211,238,0.2)] aspect-[16/10]">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
                    <div className="absolute left-4 top-4 z-20 h-10 w-10 rounded-tl border-l-[1.5px] border-t-[1.5px] border-cyan-400/30" />
                    <div className="absolute right-4 top-4 z-20 h-10 w-10 rounded-tr border-r-[1.5px] border-t-[1.5px] border-cyan-400/30" />
                    <div className="absolute bottom-4 left-4 z-20 h-10 w-10 rounded-bl border-b-[1.5px] border-l-[1.5px] border-cyan-400/30" />
                    <div className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-br border-b-[1.5px] border-r-[1.5px] border-cyan-400/30" />
                    <div className="absolute left-5 top-5 z-20 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                      </span>
                      <span className="text-[0.625rem] font-bold tracking-[0.12em] uppercase text-white/80">Live scan feed</span>
                    </div>
                    <video className="h-full w-full object-cover" src="/videos/scan-parking.mp4" autoPlay muted defaultMuted loop playsInline preload="metadata" />
                  </div>
                </motion.div>
              </div>

              {/* Right column — Card 02 + Card 04 */}
              <div className="flex flex-col justify-between gap-6 h-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredStep("02")}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="w-full max-w-[280px] rounded-3xl border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <span className="pointer-events-none absolute right-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-white/[0.04]">02</span>
                  <div className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70"><BarChart3 size={20} /></span>
                    <h4 className="mt-3 text-sm font-semibold text-white">Score each candidate</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">Each slot is scored using four weighted criteria per slot.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredStep("04")}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="w-full max-w-[280px] rounded-3xl border border-cyan-400/25 bg-black/55 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_8px_40px_rgba(34,211,238,0.1)]"
                >
                  <span className="pointer-events-none absolute right-3 top-2 select-none text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-cyan-400/10">04</span>
                  <div className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-400"><Trophy size={22} /></span>
                    <h4 className="mt-3 text-sm font-semibold text-cyan-300">Assign the top slot</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">Highest score wins the recommendation as the best available spot.</p>
                    <div className="mt-3 h-[2px] w-12 rounded-full bg-gradient-to-r from-cyan-400 to-transparent" />
                  </div>
                </motion.div>
              </div>

            </div>

            {/* ── Connector Lines SVG (desktop overlay) — from card edges toward video ── */}
            <svg
              className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full lg:block"
              viewBox="0 0 1600 820"
              preserveAspectRatio="xMidYMid meet"
              style={{ opacity: 0.35 }}
            >
              <g style={{ opacity: hoveredStep === null || hoveredStep === "01" ? 1 : 0.2, transition: "opacity 0.3s" }}>
                <path d="M 320 120 Q 350 130 380 160" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="320" cy="120" r="2.5" fill="rgba(34,211,238,0.35)" />
                <circle cx="380" cy="160" r="2.5" fill="rgba(34,211,238,0.35)" />
              </g>
              <g style={{ opacity: hoveredStep === null || hoveredStep === "02" ? 1 : 0.2, transition: "opacity 0.3s" }}>
                <path d="M 1280 120 Q 1250 130 1220 160" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="1280" cy="120" r="2.5" fill="rgba(34,211,238,0.35)" />
                <circle cx="1220" cy="160" r="2.5" fill="rgba(34,211,238,0.35)" />
              </g>
              <g style={{ opacity: hoveredStep === null || hoveredStep === "03" ? 1 : 0.2, transition: "opacity 0.3s" }}>
                <path d="M 320 700 Q 350 690 380 660" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="320" cy="700" r="2.5" fill="rgba(34,211,238,0.35)" />
                <circle cx="380" cy="660" r="2.5" fill="rgba(34,211,238,0.35)" />
              </g>
              <g style={{ opacity: hoveredStep === null || hoveredStep === "04" ? 1 : 0.2, transition: "opacity 0.3s" }}>
                <path d="M 1280 700 Q 1250 690 1220 660" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="1280" cy="700" r="2.5" fill="rgba(34,211,238,0.35)" />
                <circle cx="1220" cy="660" r="2.5" fill="rgba(34,211,238,0.35)" />
              </g>
            </svg>
          </div>
        </div>

        {/* ── 4. Scoring Criteria ── */}
        <div className="relative mx-auto mb-20 max-w-6xl">


          <HeroFadeIn delay={0.1}>
            <div className="relative mb-8 text-center">
              <span
                className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                How scoring works
              </span>
              <p
                className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                ParkMaster does not guess. It ranks every available slot with four weighted criteria and selects the highest scoring candidate.
              </p>
            </div>
          </HeroFadeIn>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CRITERIA.map((card, i) => (
              <HeroFadeIn key={card.key} delay={0.1 + i * 0.06} y={16}>
                <div
                  className="group flex flex-col min-h-[185px] sm:min-h-[170px] rounded-xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07] sm:p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-300/50 shrink-0" />
                      <h3
                        className="text-xs font-semibold tracking-tight sm:text-sm"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {card.short}
                      </h3>
                    </div>
                    <span
                      className="nums shrink-0 rounded-md px-2 py-0.5 text-[0.625rem] font-bold sm:text-xs"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "hsl(186,70%,45%)",
                      }}
                    >
                      {card.max} pts
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-[0.625rem] leading-relaxed sm:text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {card.description}
                  </p>
                  <div className="mt-auto pt-3">
                    <motion.div
                      className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(card.max / 40) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.25 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          background: "linear-gradient(90deg, hsl(186,70%,45%) 0%, rgba(56,189,248,0.3) 100%)",
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </HeroFadeIn>
            ))}
          </div>
        </div>

        {/* ── Live Availability anchor ── */}
        <div id="availability" />

        {/* ── 5. Live preview ── */}
        <HeroFadeIn className="mx-auto mb-10 max-w-6xl text-center">
          <span
            className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            LIVE PREVIEW
          </span>
          <h3
            className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
            Try the allocation engine
          </h3>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Switch building or vehicle type and watch the ranked candidates update from the current API data.
          </p>
        </HeroFadeIn>

        {/* ── Selectors ── */}
        <div className="mx-auto mb-10 max-w-6xl">
          <HeroFadeIn delay={0.05}>
            <div className="flex flex-wrap items-start gap-8 sm:gap-12">
              <div>
                <div
                  className="mb-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Building
                </div>
                <div className="flex flex-wrap gap-2">
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBuildingId(b.id)}
                      className={
                        buildingId === b.id
                          ? "rounded-full border border-white/80 bg-white/[0.08] text-white px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white hover:bg-white/[0.12] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                          : "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                      }
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="mb-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Vehicle type
                </div>
                <div className="flex flex-wrap gap-2">
                  {vehicleTypes.map((t) => (
                    <button
                      key={t.vehicleTypeId}
                      onClick={() => setVehicleTypeId(t.vehicleTypeId)}
                      className={
                        vehicleTypeId === t.vehicleTypeId
                          ? "rounded-full border border-white/80 bg-white/[0.08] text-white px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white hover:bg-white/[0.12] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                          : "rounded-full border border-white/10 text-white/60 px-5 py-2 text-sm font-medium transition-all duration-200 hover:border-white/30 hover:text-white hover:bg-white/[0.04] hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                      }
                    >
                      {t.vehicleTypeName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </HeroFadeIn>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <p className="py-20 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {error}
          </p>
        )}

        {/* ── Main demo ── */}
        {!loading && !error && winner && (
          <div className="mx-auto mb-16 grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            {/* ─── Best slot card ─── */}
            <HeroFadeIn delay={0.15} className="h-fit">
              <div
                className="rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 sm:rounded-3xl sm:p-8"
                style={{
                  borderColor: "var(--card-border)",
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <Trophy size={12} /> AI PICK FOR{" "}
                  {activeVehicleName.toUpperCase()}
                </span>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <motion.div
                      key={winner.slotCode}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="text-4xl font-semibold tracking-tight sm:text-5xl"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {winner.slotCode}
                    </motion.div>
                    <div
                      className="mt-1 text-sm"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {winner.floorName} &middot; Level {winner.level}
                    </div>
                  </div>
                  <motion.div
                    key={winner.total}
                    className="text-right"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className="text-4xl font-semibold tracking-tight sm:text-5xl"
                      style={{
                        color: "hsl(186,70%,45%)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {winner.total}
                    </div>
                    <div
                      className="text-xs uppercase tracking-wide"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      SCORE / 100
                    </div>
                  </motion.div>
                </div>

                <p
                  className="mt-4 border-t pt-4 text-sm leading-relaxed sm:mt-5 sm:pt-5"
                  style={{
                    borderColor: "var(--card-border)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <span style={{ opacity: 0.6 }}>Won because </span>
                  {topReason(winner)}.
                </p>

                {/* Animated breakdown bars */}
                <div className="mt-5 space-y-3">
                  {CRITERIA.map((c) => {
                    const val = winner[c.key] ?? 0;
                    const pct = Math.min(100, (val / c.max) * 100);
                    return (
                      <motion.div
                        key={`${winner.slotId}-${c.key}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "hsl(var(--muted-foreground))" }}>
                            {c.label}
                          </span>
                          <span className="nums" style={{ color: "hsl(var(--foreground))" }}>
                            {val}/{c.max}
                          </span>
                        </div>
                        <div className="mt-1.5 h-[5px] rounded-[2.5px] bg-white/[0.05] overflow-hidden">
                          <motion.div
                            className="h-full rounded-[2.5px]"
                            style={{
                              background:
                                "linear-gradient(90deg, hsl(186,70%,45%) 0%, rgba(56,189,248,0.45) 100%)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </HeroFadeIn>

            {/* ─── Runners-up + CTA + Video ─── */}
            <div className="flex flex-col gap-6">
              <HeroFadeIn delay={0.2}>
                <div
                  className="rounded-2xl border p-6 backdrop-blur-sm sm:rounded-3xl sm:p-8"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--card-bg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Runners-up
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {runners.length} candidates
                    </span>
                  </div>
                  <div className="mt-4 space-y-1">
                    {runners.map((r, i) => {
                      const isFirst = i === 0;
                      return (
                        <div
                          key={r.slotCode}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                            isFirst
                              ? "bg-white/[0.03] border border-white/[0.06]"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <span
                            className="nums flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                            style={{
                              backgroundColor: isFirst
                                ? "rgba(255,255,255,0.08)"
                                : "transparent",
                              color: isFirst
                                ? "hsl(var(--foreground))"
                                : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {i + 2}
                          </span>
                          <span
                            className="nums font-medium"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {r.slotCode}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {r.floorName}
                          </span>
                          <span
                            className="nums ml-auto text-xs"
                            style={{
                              color: isFirst
                                ? "hsl(186,70%,45%)"
                                : "hsl(var(--muted-foreground))",
                              fontWeight: isFirst ? 600 : 400,
                            }}
                          >
                            {r.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </HeroFadeIn>

              {/* CTA */}
              <HeroFadeIn delay={0.3}>
                <Link
                  to="/app/reservations"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white no-underline transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                >
                  Assign Best Slot{" "}
                  <ArrowRight
                    size={15}
                    className="inline-block transition-all duration-300 opacity-70 group-hover:translate-x-[3px] group-hover:opacity-100"
                  />
                </Link>
              </HeroFadeIn>


            </div>
          </div>
        )}

        {/* ── Live Availability ── */}
        <HeroFadeIn delay={0.2} className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <div
              className="text-[0.6875rem] font-medium tracking-[0.12em] uppercase mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Live availability
            </div>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Real-time open slots across all buildings.
            </p>
          </div>
          <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
            {availability.map((a) => {
              const pct =
                a.totalSlots > 0
                  ? Math.round((a.availableSlots / a.totalSlots) * 100)
                  : 0;
              return (
                <div
                  key={a.buildingId}
                  className="rounded-xl border p-5 backdrop-blur-sm"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "rgba(0,0,0,0.35)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {a.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Open slots
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-semibold"
                        style={{
                          color: "hsl(var(--foreground))",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {a.availableSlots}/{a.totalSlots}
                      </div>
                    </div>
                  </div>
                  <div className="h-[5px] rounded-[2.5px] bg-white/[0.05] overflow-hidden mt-3">
                    <div
                      className="h-full rounded-[2.5px] bg-gradient-to-r from-[hsl(186,70%,45%)] to-[rgba(56,189,248,0.25)] transition-all duration-[0.6s] ease"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </HeroFadeIn>
      </div>
    </section>
  );
}

function ParkingRolesSection() {
  return (
    <section
      id="for-teams"
      className="border-t px-6 py-16 sm:py-24 scroll-mt-24"
      style={{ borderColor: "var(--card-border)" }}
    >
      <div className="mx-auto max-w-5xl">
        <HeroFadeIn className="text-center">
          <h2
            className="text-2xl md:text-4xl leading-[1.15] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "hsl(var(--foreground))",
            }}
          >
            For teams running modern parking buildings.
          </h2>
          <p
            className="text-sm leading-[1.65] mx-auto mt-2 max-w-2xl"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            ParkMaster gives managers, gate staff, finance teams, and support
            staff one shared system to handle parking operations from entry to
            checkout.
          </p>
        </HeroFadeIn>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {TEAMS.map(({ icon: Icon, title, desc }, i) => (
            <HeroFadeIn key={title} delay={i * 0.08}>
              <div
                className="group h-full rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                style={{
                  borderColor: "var(--card-border)",
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <span
                  className="flex size-10 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:border-white/25"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--card-bg)",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <Icon size={18} />
                </span>
                <div className="mt-4">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {desc}
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

function FinalCTASection() {
  return (
    <section
      id="pricing"
      className="border-t px-6 py-20 sm:py-28 scroll-mt-24"
      style={{ borderColor: "var(--card-border)" }}
    >
      <HeroFadeIn className="mx-auto max-w-3xl text-center">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl leading-[1.15] tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "hsl(var(--foreground))",
          }}
        >
          Ready to make parking feel effortless?
        </h2>
        <p
          className="text-sm leading-[1.65] mx-auto mt-3 max-w-xl"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Use ParkMaster to connect reservations, AI slot allocation, live
          availability, sessions, payments, and operations in one system.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_30px_rgba(56,189,248,0.06)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-white/[0.06] backdrop-blur-md border border-white/20 shadow-[0_1px_12px_rgba(0,0,0,0.3)]"
          >
            Get Started <ArrowRight size={15} />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white/70 no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-transparent border border-white/20"
          >
            View Pricing
          </Link>
        </div>
      </HeroFadeIn>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      id="contact"
      className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.015] to-white/[0.005] px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
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
              className="text-xs mt-0.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Parking Building Management System
            </p>
            <p className="text-xs leading-relaxed text-white/45 mt-2 max-w-[22rem]">
              Smart parking operations for modern buildings &mdash; AI
              allocation, live availability, reservations, and secure checkout.
            </p>
          </div>
          {/* Navigation */}
          <div>
            <div className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">
              Navigate
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/app/dashboard"
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Dashboard
              </Link>
              <Link
                to="/app/reservations"
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Reservations
              </Link>
              <button
                onClick={() => scrollTo("pricing")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Contact
              </button>
            </div>
          </div>
          {/* Product */}
          <div>
            <div className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-white/30 mb-3">
              Product
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => scrollTo("ai-allocation")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                AI Allocation
              </button>
              <button
                onClick={() => scrollTo("parking-flow")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Parking Flow
              </button>
              <button
                onClick={() => scrollTo("core-features")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                Core Features
              </button>
              <button
                onClick={() => scrollTo("for-teams")}
                className="text-[0.8125rem] text-white/55 inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-[3px] cursor-pointer bg-transparent border-none p-0 font-[inherit] focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4 focus-visible:rounded-sm"
              >
                For teams
              </button>
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
  { label: "Pricing", target: "/pricing", isRoute: true },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState("hero-home");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("hero-scroll");
    return () => document.documentElement.classList.remove("hero-scroll");
  }, []);

  useEffect(() => {
    const SECTION_IDS = ["hero-home", "parking-flow", "about-parkmaster", "core-features", "ai-allocation", "availability", "for-teams"];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
      setScrolled(scrollTop > 20);

      let current = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 150) {
          current = id;
        }
      }
      setActiveNav(current);
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
      {/* Fixed floating glass navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center px-4 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
        <div
          className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-3 rounded-2xl sm:rounded-[32px] transition-all duration-500"
          style={{
            background: scrolled || menuOpen
              ? "rgba(0,0,0,0.72)"
              : "transparent",
            backdropFilter: scrolled || menuOpen ? "blur(20px) saturate(1.8)" : "none",
            WebkitBackdropFilter: scrolled || menuOpen ? "blur(20px) saturate(1.8)" : "none",
            border: scrolled || menuOpen
              ? "1px solid rgba(255,255,255,0.08)"
              : "none",
            boxShadow: scrolled || menuOpen
              ? "0 8px 32px rgba(0,0,0,0.45), 0 0 60px rgba(34,211,238,0.03)"
              : "none",
          }}
        >
          <span
            className="text-2xl sm:text-3xl tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "#ffffff",
            }}
          >
            ParkMaster
          </span>
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map(({ label, target, isRoute }) =>
              isRoute ? (
                <Link
                  key={target}
                  to={target}
                  onClick={() => window.scrollTo(0, 0)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/[0.08] no-underline"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={target}
                  onClick={() => handleNavClick(target)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/[0.08] cursor-pointer bg-none border-none focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2"
                  style={{
                    color:
                      activeNav === target ? "#ffffff" : "rgba(255,255,255,0.65)",
                    backgroundColor:
                      activeNav === target
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                  }}
                >
                  {label}
                </button>
              ),
            )}
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

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="pointer-events-auto mx-auto mt-2 w-full max-w-7xl rounded-2xl border border-white/[0.08] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            style={{
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(20px) saturate(1.8)",
            }}
          >
            {NAV_ITEMS.map(({ label, target, isRoute }) =>
              isRoute ? (
                <Link
                  key={target}
                  to={target}
                  onClick={() => { window.scrollTo(0, 0); setMenuOpen(false); }}
                  className="block w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-white/[0.08] no-underline"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={target}
                  onClick={() => { handleNavClick(target); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-white/[0.08] cursor-pointer bg-none border-none"
                  style={{
                    color: activeNav === target ? "#ffffff" : "rgba(255,255,255,0.65)",
                    backgroundColor: activeNav === target ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        )}
      </nav>

      <section
        id="hero-home"
        className="relative min-h-screen overflow-hidden scroll-mt-24 pt-24"
      >
        {/* Cinematic gradient overlay — darker at edges, brighter center for readability */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `
            radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.55) 100%)
          `,
          }}
        />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src="/videos/parking-hero.mp4" type="video/mp4" />
        </video>

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
              textShadow:
                "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            Smart{" "}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>parking</span>,
            from{" "}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>
              entry to checkout
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{
              color: "rgba(255,255,255,0.8)",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            ParkMaster helps drivers reserve spaces, enter faster, track active
            sessions, and pay securely. For operators, PBMS brings AI slot
            allocation, real-time availability, monthly passes, and parking
            insights into one clean system.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/app/reservations"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_30px_rgba(56,189,248,0.06)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-white/[0.06] backdrop-blur-md border border-white/20 shadow-[0_1px_12px_rgba(0,0,0,0.3)] px-12 py-4 text-base"
            >
              Reserve your spot
            </Link>
            <button
              onClick={() => scrollTo("ai-allocation")}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white/70 no-underline cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 bg-transparent border border-white/20 px-7 py-4 text-base"
            >
              Explore AI Tech
            </button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="mt-5 text-xs tracking-wide"
            style={{
              color: "rgba(255,255,255,0.65)",
              textShadow: "0 1px 6px rgba(0,0,0,0.4)",
            }}
          >
            AI-assisted allocation &middot; Live availability &middot; Secure
            checkout
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
