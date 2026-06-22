import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History, ChevronDown, CreditCard, Star, MessageSquare } from "lucide-react";
import { Card, Button, Input, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MySessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState(null);
  const [payBySession, setPayBySession] = useState({});
  const [fbBySession, setFbBySession] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");
  const [vnpayMsg, setVnpayMsg] = useState("");
  const [search, setSearch] = useState("");
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

  if (error) return <Alert>{error}</Alert>;
  if (sessions === null) return <Spinner label="Loading sessions" />;

  const q = search.toLowerCase().trim();
  const filtered = sessions.filter(
    (s) =>
      !q ||
      [s.licensePlate, s.slotCode]
        .map((v) => (v ?? "").toLowerCase())
        .some((v) => v.includes(q))
  );

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">My sessions</h1>
      <p className="mt-1 text-sm text-muted">Every check-in and what you paid.</p>

      {vnpayMsg && (
        <Alert className="mt-4" variant={vnpayMsg.includes("successful") ? "success" : "error"}>
          {vnpayMsg}
        </Alert>
      )}

      {sessions.length > 0 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by license plate or slot..."
          className="mt-4"
        />
      )}

      {sessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No sessions yet" hint="Your parking history will appear here." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No matches" hint="Try a different search." />
        </div>
      ) : (
        <>
          <Card className="mt-6 divide-y divide-line">
            {filtered.slice(0, visibleCount).map((s) => {
              const pay = payBySession[s.id];
              const open = expanded === s.id;
              return (
                <div key={s.id}>
                  <button
                    onClick={() => setExpanded(open ? null : s.id)}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-elevated"
                  >
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="nums text-xs text-muted">#{s.id}</span>
                        <span className="nums text-[15px] font-semibold">{s.licensePlate}</span>
                        <StatusBadge status={s.status} />
                        {s.autoAllocated && <ScoreBreakdownCard score={s.allocationScore} compact />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                        <span className="nums">{time(s.checkInAt)}</span>
                        <span className="text-line">|</span>
                        <span className="nums">{s.checkOutAt ? time(s.checkOutAt) : "parked"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="nums text-sm font-semibold">{money(s.amountCharged)}</div>
                      {pay && (
                        <div className="text-[11px] text-muted">
                          {pay.status === "PAID" ? "paid" : (pay.status ?? "").toLowerCase()}
                        </div>
                      )}
                    </div>
                  </button>
                  {open && <SessionDetail session={s} payment={pay} feedback={fbBySession[s.id]} onPaid={load} />}
                </div>
              );
            })}
          </Card>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-elevated hover:text-primary"
            >
              Show more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SessionDetail({ session: s, payment: pay, feedback: fb, onPaid }) {
  return (
    <div className="border-t border-line bg-elevated/50 px-5 py-4 text-sm">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        <Info label="Session ID" value={`#${s.id}`} />
        <Info label="License plate" value={s.licensePlate} />
        <Info label="Vehicle type" value={s.vehicleTypeName ?? "-"} />
        <Info label="Slot" value={s.buildingName ? `${s.buildingName} › ${s.floorName} › ${s.slotCode}` : s.slotCode ?? s.slotId ?? "-"} />
        <Info label="Allocation" value={s.autoAllocated ? "Auto" : "Manual"} />
        <Info label="Checked in" value={time(s.checkInAt)} />
        <Info label="Checked out" value={s.checkOutAt ? time(s.checkOutAt) : "Still parked"} />
        <Info label="Charge" value={money(s.amountCharged)} />
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
  const [vnLoading, setVnLoading] = useState(false);
  const [err, setErr] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setErr("");
    try {
      await driverApi.pay(paymentId);
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVnPay = async () => {
    setVnLoading(true);
    setErr("");
    try {
      const { paymentUrl } = await driverApi.vnpay(paymentId);
      window.location.href = paymentUrl;
    } catch (e) {
      setErr(e.message);
      setVnLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {err && <p className="mb-2 text-sm text-occupied">{err}</p>}
      <div className="flex gap-2">
        <Button onClick={handlePay} loading={loading}>Pay (mark paid)</Button>
        <Button onClick={handleVnPay} loading={vnLoading} variant="accent">
          <CreditCard size={14} className="mr-1.5" />
          Pay with VNPay
        </Button>
      </div>
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
          className={`transition ${n <= value ? "text-amber-400" : "text-muted/30"} ${onChange ? "hover:text-amber-300 cursor-pointer" : "cursor-default"}`}
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
