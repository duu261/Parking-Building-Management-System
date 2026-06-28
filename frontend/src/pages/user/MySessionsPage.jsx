import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { History, Search, ChevronDown, CreditCard, Star, MessageSquare, Car, Clock, DollarSign, CheckCircle2, MapPin, Building2, Sparkles } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const STATUS_GROUPS = [
  { key: "ACTIVE", label: "Active now", color: "var(--available)", lightBg: "bg-available/[0.04]" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment", color: "var(--locked)", lightBg: "bg-locked/[0.04]" },
  { key: "COMPLETED", label: "History", color: "transparent", lightBg: "" },
];

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "AWAITING_PAYMENT", label: "Unpaid" },
  { key: "COMPLETED", label: "Completed" },
];

export default function MySessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState(null);
  const [payBySession, setPayBySession] = useState({});
  const [fbBySession, setFbBySession] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");
  const [vnpayMsg, setVnpayMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setVnpayMsg(status === "success" ? "Payment successful!" : "Payment failed or cancelled.");
      setSearchParams({}, { replace: true });
    }
  }, []);

  const load = () => {
    Promise.all([driverApi.sessions(), driverApi.payments(), driverApi.feedback()])
      .then(([s, p, fb]) => {
        setSessions(s);
        setPayBySession(Object.fromEntries(p.map((x) => [x.sessionId, x])));
        setFbBySession(Object.fromEntries(fb.map((x) => [x.sessionId, x])));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const stats = useMemo(() => {
    if (!sessions) return null;
    const active = sessions.filter((s) => s.status === "ACTIVE").length;
    const awaiting = sessions.filter((s) => s.status === "AWAITING_PAYMENT").length;
    const completed = sessions.filter((s) => s.status === "COMPLETED").length;
    const totalSpent = sessions
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s.amountCharged ?? 0), 0);
    return { active, awaiting, completed, totalSpent, total: sessions.length };
  }, [sessions]);

  if (error) return <Alert>{error}</Alert>;
  if (sessions === null) return <Spinner label="Loading sessions" />;

  const q = search.toLowerCase().trim();
  const filtered = sessions.filter((s) => {
    if (q && ![s.licensePlate, s.slotCode, s.buildingName, s.vehicleTypeName]
      .some((v) => (v ?? "").toLowerCase().includes(q))) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const visibleList = filtered.slice(0, visibleCount);
  const groups = !statusFilter
    ? STATUS_GROUPS.map((g) => ({
        ...g,
        sessions: visibleList.filter((s) => s.status === g.key),
      })).filter((g) => g.sessions.length > 0)
    : [{ key: statusFilter, label: STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? statusFilter, color: "", lightBg: "", sessions: visibleList }];

  const showMoreVisible = visibleCount < filtered.length;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My sessions</h1>
          <p className="mt-0.5 text-sm text-muted">Every check-in and what you paid.</p>
        </div>
      </div>

      {vnpayMsg && (
        <div className={`mt-4 rounded-[var(--radius)] border px-3 py-2 text-sm ${
          vnpayMsg.includes("successful")
            ? "border-available/30 bg-available/10 text-available"
            : "border-occupied/30 bg-occupied/10 text-occupied"
        }`}>
          {vnpayMsg}
        </div>
      )}

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon={Car} label="Active" value={stats.active} accent={stats.active > 0} color="var(--available)" />
          <SummaryCard icon={Clock} label="Unpaid" value={stats.awaiting} accent={stats.awaiting > 0} color="var(--locked)" />
          <SummaryCard icon={CheckCircle2} label="Completed" value={stats.completed} />
          <SummaryCard icon={DollarSign} label="Total spent" value={money(stats.totalSpent)} />
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plate, slot, or building..."
              className="w-full border border-line bg-surface py-2 pl-9 pr-3 text-sm text-text outline-none transition rounded-[var(--radius)] placeholder:text-muted/70 focus:border-text/40 focus:ring-2 focus:ring-text/15"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === f.key
                    ? "bg-accent text-accent-fg shadow-[var(--shadow-card)]"
                    : "border border-line bg-surface text-muted hover:bg-elevated hover:text-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No sessions yet" hint="Your parking history will appear here." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No matches" hint="Try a different search or filter." />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">{group.label}</h2>
                <span className="text-xs text-muted">({group.sessions.length})</span>
                {group.key === "ACTIVE" && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--available)" }} />}
                {group.key === "AWAITING_PAYMENT" && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--locked)" }} />}
              </div>
              <div className="space-y-3">
                {group.sessions.map((s) => {
                  const pay = payBySession[s.id];
                  const open = expanded === s.id;
                  const isActive = s.status === "ACTIVE";
                  const isAwaiting = s.status === "AWAITING_PAYMENT";
                  const isCompleted = s.status === "COMPLETED";
                  const accentColor = isActive ? "var(--available)" : isAwaiting ? "var(--locked)" : "";

                  return (
                    <Card key={s.id} className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
                      <button
                        onClick={() => setExpanded(open ? null : s.id)}
                        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-elevated/40"
                      >
                        <div className="flex shrink-0 items-center gap-2">
                          <div
                            className="flex size-10 items-center justify-center rounded-[var(--radius)]"
                            style={{ backgroundColor: isActive ? "var(--available)" : isAwaiting ? "var(--locked)" : "var(--elevated)" }}
                          >
                            {isActive ? (
                              <Car size={16} className="text-white" />
                            ) : isAwaiting ? (
                              <DollarSign size={16} className="text-white" />
                            ) : (
                              <CheckCircle2 size={16} className="text-muted" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="nums text-sm font-semibold">{s.licensePlate}</span>
                            <StatusBadge status={s.status} />
                            {s.autoAllocated && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted/70">
                                <Sparkles size={10} /> AI assigned
                              </span>
                            )}
                            {s.fromReservation && !s.depositCredit && (
                              <span className="rounded-full bg-available/10 px-2 py-0.5 text-xs font-medium text-available">10% off</span>
                            )}
                            {s.fromReservation && s.depositCredit > 0 && (
                              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{money(s.depositCredit)} deposit</span>
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {s.buildingName || s.slotCode || "-"}
                            </span>
                            <span className="flex items-center gap-1.5 nums">
                              <Clock size={11} />
                              <span>{time(s.checkInAt)}</span>
                              <span className="text-muted/30">→</span>
                              <span>{s.checkOutAt ? time(s.checkOutAt) : "parked"}</span>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="nums text-sm font-semibold">{money(s.amountCharged)}</div>
                          {pay && (
                            <div className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              pay.status === "PAID"
                                ? "bg-available/10 text-available"
                                : "bg-locked/10 text-locked"
                            }`}>
                              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pay.status === "PAID" ? "var(--available)" : "var(--locked)" }} />
                              {pay.status === "PAID" ? "Paid" : (pay.status ?? "").toLowerCase()}
                            </div>
                          )}
                          <div className="mt-1.5 flex justify-end">
                            <ChevronDown
                              size={13}
                              className={`text-muted/50 transition duration-200 ${open ? "rotate-180" : ""}`}
                            />
                          </div>
                        </div>
                      </button>
                      {open && <SessionDetail session={s} payment={pay} feedback={fbBySession[s.id]} onPaid={load} />}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
          {showMoreVisible && (
            <div className="text-center">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Show more sessions ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, color }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-elevated">
        <Icon size={15} className={accent ? "" : "text-muted"} style={accent ? { color } : undefined} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="nums mt-0.5 text-lg font-semibold">{value}</div>
      </div>
    </Card>
  );
}

function SessionDetail({ session: s, payment: pay, feedback: fb, onPaid }) {
  const hasAiScore = s.autoAllocated && s.allocationScore;
  return (
    <div className="border-t border-line bg-elevated/30 px-4 py-3.5 text-sm">
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3">
        <Info label="Session" value={`#${s.id}`} />
        <Info label="License plate" value={s.licensePlate} />
        <Info label="Vehicle type" value={s.vehicleTypeName ?? "-"} />
        <Info label="Slot" value={s.buildingName ? `${s.buildingName} › ${s.floorName} › ${s.slotCode}` : s.slotCode ?? s.slotId ?? "-"} />
        <Info label="Allocation" value={s.autoAllocated ? "Auto" : "Manual"} />
        <Info label="Checked in" value={time(s.checkInAt)} />
        <Info label="Checked out" value={s.checkOutAt ? time(s.checkOutAt) : "Still parked"} />
        <Info label="Charge" value={money(s.amountCharged)} />
        {s.fromReservation && !s.depositCredit && <Info label="Discount" value="Free reservation · 10% off applied" />}
        {s.fromReservation && s.depositCredit > 0 && <Info label="Deposit credit" value={`${money(s.depositCredit)} subtracted from charge`} />}
        {hasAiScore && (
          <div className="col-span-2 sm:col-span-3">
            <div className="mb-1.5 text-xs text-muted">Allocation score</div>
            <ScoreBreakdownCard score={s.allocationScore} />
          </div>
        )}
        {pay && (
          <>
            <Info label="Payment status" value={pay.status} />
            <Info label="Payment method" value={pay.method ?? "-"} />
            <Info label="Paid at" value={pay.paidAt ? time(pay.paidAt) : "-"} />
          </>
        )}
      </div>
      {pay?.status === "PENDING" && s.status !== "ACTIVE" && (
        <PayButton paymentId={pay.id} onDone={onPaid} />
      )}
      {s.status === "COMPLETED" && (
        fb ? <ExistingFeedback fb={fb} /> : <FeedbackForm sessionId={s.id} onDone={onPaid} />
      )}
    </div>
  );
}

function PayButton({ paymentId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleVnPay = async () => {
    setLoading(true);
    setErr("");
    try {
      const { paymentUrl } = await driverApi.vnpay(paymentId);
      window.location.href = paymentUrl;
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {err && <p className="mb-2 text-sm text-occupied">{err}</p>}
      <Button onClick={handleVnPay} loading={loading}>
        <CreditCard size={14} /> Pay with VNPay
      </Button>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`transition ${n <= value ? "text-locked" : "text-muted/30"} ${onChange ? "hover:text-locked/80 cursor-pointer" : "cursor-default"}`}
        >
          <Star size={18} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function FeedbackForm({ sessionId, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setErr("Please select a rating"); return; }
    setLoading(true);
    setErr("");
    try {
      await driverApi.submitFeedback(sessionId, rating, comment || null);
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 pt-3 border-t border-line">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} className="text-muted" />
        <span className="text-xs font-medium text-muted">Rate your experience</span>
      </div>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        maxLength={500}
        rows={2}
        className="mt-2 w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {err && <p className="mt-1 text-sm text-occupied">{err}</p>}
      <Button type="submit" loading={loading} className="mt-2">Submit feedback</Button>
    </form>
  );
}

function ExistingFeedback({ fb }) {
  return (
    <div className="mt-3 pt-3 border-t border-line">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={14} className="text-muted" />
        <span className="text-xs font-medium text-muted">Your feedback</span>
      </div>
      <StarRating value={fb.rating} />
      {fb.comment && <p className="mt-1 text-sm text-muted">{fb.comment}</p>}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="nums mt-0.5 font-medium">{value}</div>
    </div>
  );
}
