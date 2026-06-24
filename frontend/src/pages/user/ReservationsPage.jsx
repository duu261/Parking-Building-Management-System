import { useState, useEffect } from "react";
import { CalendarClock, MapPin, QrCode, X, Building2, Sparkles, Clock, CreditCard } from "lucide-react";
import { driverApi, publicApi } from "../../lib/endpoints";
import { Card, Button, Spinner, Alert, EmptyState, StatusBadge, Field, Select, Input } from "../../components/ui";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const time = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const EMPTY = { buildingId: "", vehicleTypeId: "", licensePlate: "", reservedStart: "", reservationType: "FREE", slotId: "" };

export default function ReservationsPage() {
  const [list, setList] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [vnpayPrompt, setVnpayPrompt] = useState(null);
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = async () => {
    try {
      const [res, bldgs, vt] = await Promise.all([
        driverApi.reservations(),
        publicApi.buildings(),
        publicApi.pricing(),
      ]);
      setList(res);
      setBuildings(bldgs);
      setTypes(vt);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const isPaid = form.reservationType === "PAID";
  const canSubmit = form.buildingId && form.vehicleTypeId && form.licensePlate.trim()
    && form.reservedStart && (!isPaid || form.slotId);

  useEffect(() => {
    if (isPaid && form.buildingId && form.vehicleTypeId) {
      setLoadingSuggestions(true);
      driverApi.suggestSlots(form.buildingId, form.vehicleTypeId)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    } else {
      setSuggestions([]);
    }
  }, [isPaid, form.buildingId, form.vehicleTypeId]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body = {
        buildingId: Number(form.buildingId),
        vehicleTypeId: Number(form.vehicleTypeId),
        licensePlate: form.licensePlate.trim(),
        reservedStart: new Date(form.reservedStart).toISOString(),
        reservationType: form.reservationType,
        ...(isPaid && form.slotId ? { slotId: Number(form.slotId) } : {}),
      };
      const res = await driverApi.reserve(body);
      if (res.vnpayUrl) {
        setVnpayPrompt({ url: res.vnpayUrl, amount: res.depositAmount });
        setForm(EMPTY);
        load();
        return;
      }
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    setCancelling(id);
    try {
      await driverApi.cancelReservation(id);
      load();
    } finally {
      setCancelling(null);
    }
  };

  const toLocalISO = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const minTime = () => { const d = new Date(); d.setMinutes(d.getMinutes() + 5); return toLocalISO(d); };
  const maxTime = () => { const d = new Date(); d.setHours(d.getHours() + 3); return toLocalISO(d); };
  const presetTime = (mins) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + mins);
    setForm({ ...form, reservedStart: toLocalISO(d) });
  };

  if (!list && !error) return <Spinner />;
  if (error && list === null) return <Alert>{error}</Alert>;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Reservations</h1>
      <p className="mt-1 text-sm text-muted">
        Book ahead — free reservations get 10% off, paid ones guarantee your exact slot.
      </p>

      {error && <Alert className="mt-4">{error}</Alert>}

      {/* ── Reservation form ── */}
      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="space-y-4">
          {/* Tier toggle */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, reservationType: "FREE", slotId: "" })}
              className={`flex-1 rounded-[var(--radius)] border p-3 text-center text-sm transition ${
                !isPaid ? "border-accent bg-accent/10 font-medium text-accent" : "border-line text-muted hover:bg-surface"
              }`}>
              <Sparkles size={14} className="mx-auto mb-1" />
              Free · AI assigns · 10% off
            </button>
            <button type="button" onClick={() => setForm({ ...form, reservationType: "PAID" })}
              className={`flex-1 rounded-[var(--radius)] border p-3 text-center text-sm transition ${
                isPaid ? "border-accent bg-accent/10 font-medium text-accent" : "border-line text-muted hover:bg-surface"
              }`}>
              <CreditCard size={14} className="mx-auto mb-1" />
              Paid · Pick slot · Guaranteed
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Building">
              <Select value={form.buildingId} onChange={set("buildingId")} required>
                <option value="">Select building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Vehicle type">
              <Select value={form.vehicleTypeId} onChange={set("vehicleTypeId")} required>
                <option value="">Select type</option>
                {types.map((t) => (
                  <option key={t.vehicleTypeId} value={t.vehicleTypeId}>{t.vehicleTypeName}</option>
                ))}
              </Select>
            </Field>
            <Field label="License plate">
              <Input value={form.licensePlate} onChange={set("licensePlate")} placeholder="51A-12345" maxLength={20} required />
            </Field>
            <Field label="Arrival time">
              <Input type="datetime-local" value={form.reservedStart} onChange={set("reservedStart")}
                min={minTime()} max={maxTime()} required />
              <div className="mt-1.5 flex gap-1.5">
                {[{m: 30, l: "30 min"}, {m: 60, l: "1 hr"}, {m: 120, l: "2 hr"}, {m: 180, l: "3 hr"}].map(({m, l}) => (
                  <button key={m} type="button" onClick={() => presetTime(m)}
                    className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted transition hover:border-accent hover:text-accent">
                    +{l}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Slot picker (paid only) */}
          {isPaid && form.buildingId && form.vehicleTypeId && (
            <div className="space-y-3">
              {loadingSuggestions ? (
                <div className="py-4 text-center text-sm text-muted">Loading slots...</div>
              ) : suggestions.length === 0 ? (
                <div className="py-4 text-center text-sm text-red-500">No available slots</div>
              ) : (
                <>
                  {/* AI recommendation */}
                  {(() => {
                    const best = suggestions.find(s => s.aiRecommended);
                    if (!best) return null;
                    return (
                      <button type="button"
                        onClick={() => setForm({ ...form, slotId: String(best.slotId) })}
                        className={`w-full text-left rounded-[var(--radius)] border p-4 transition ${
                          String(best.slotId) === form.slotId
                            ? "border-accent ring-1 ring-accent" : "border-accent/30 hover:border-accent"
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-accent" />
                          <span className="text-xs font-medium text-accent uppercase tracking-wide">AI Recommendation</span>
                        </div>
                        <p className="text-xs text-muted mb-3">
                          We scored {best.alternativesConsidered} slots and recommend <span className="font-semibold text-text">{best.slotCode}</span> on {best.floorName}.
                          {String(best.slotId) !== form.slotId && " Tap to select."}
                        </p>
                        <ScoreBreakdownCard score={{
                          vehicleTypeMatch: best.vehicleTypeMatch,
                          loadBalance: best.loadBalance,
                          distanceToEntry: best.distanceToEntry,
                          peakHour: best.peakHour,
                          total: best.score,
                          alternativesConsidered: best.alternativesConsidered,
                        }} />
                      </button>
                    );
                  })()}

                  {/* Slot grid grouped by floor */}
                  <div className="rounded-[var(--radius)] border border-line p-4">
                    <div className="mb-3 text-xs font-medium text-muted">Or pick any slot</div>
                    {Object.entries(suggestions.reduce((acc, s) => {
                      (acc[s.floorName] ??= []).push(s); return acc;
                    }, {})).map(([floor, slots]) => (
                      <div key={floor} className="mb-3 last:mb-0">
                        <div className="mb-1.5 text-[11px] font-medium text-muted">{floor}</div>
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
                          {slots.map((s) => (
                            <button key={s.slotId} type="button"
                              onClick={() => setForm({ ...form, slotId: String(s.slotId) })}
                              className={`rounded-[var(--radius)] border px-2 py-1.5 text-center text-xs transition ${
                                String(s.slotId) === form.slotId
                                  ? "border-accent bg-accent/10 ring-1 ring-accent font-medium"
                                  : "border-line hover:bg-surface"
                              }`}>
                              <div className="font-mono font-semibold">{s.slotCode}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={submitting} disabled={!canSubmit}>
              {isPaid ? "Reserve & Pay Deposit" : "Reserve (Free)"}
            </Button>
            {isPaid && form.vehicleTypeId && types.length > 0 && (
              <span className="text-xs text-muted">
                Deposit: {types.find(t => String(t.vehicleTypeId) === form.vehicleTypeId)?.ratePerHour?.toLocaleString() ?? "—"} VND (1hr rate)
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* VNPay confirmation */}
      {vnpayPrompt && (
        <Card className="mt-4 border-accent/30 bg-accent/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-accent" />
            <span className="text-sm font-semibold">Reservation created — pay deposit to confirm</span>
          </div>
          <p className="text-xs text-muted mb-3">
            Deposit: {Number(vnpayPrompt.amount ?? 0).toLocaleString()} VND. Your slot is held but not confirmed until payment completes.
          </p>
          <Button onClick={() => { window.location.href = vnpayPrompt.url; }}>
            Pay via VNPay
          </Button>
        </Card>
      )}

      <AvailabilityBar buildings={buildings} />

      {/* ── Reservation list ── */}
      <section className="mt-6">
        {list.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No reservations yet" />
        ) : (
          <div className="space-y-3">
            {list.slice(0, visibleCount).map((r) => (
              <ReservationCard key={r.id} reservation={r}
                onCancel={() => cancel(r.id)} cancelling={cancelling === r.id} />
            ))}
            {visibleCount < list.length && (
              <Button variant="secondary" className="w-full" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Show more
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ReservationCard({ reservation: r, onCancel, cancelling }) {
  const [showQr, setShowQr] = useState(false);
  const isPending = r.status === "PENDING";
  const borderStyle = isPending ? "border-l-4 border-l-reserved" : r.status === "EXPIRED" ? "border-l-4 border-l-line" : "";

  return (
    <Card className={`p-4 ${borderStyle}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="nums text-[15px] font-semibold">{r.licensePlate}</span>
            <StatusBadge status={r.status} />
            {r.reservationType === "PAID" && !r.depositPaid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600">
                <Clock size={10} /> Awaiting payment
              </span>
            )}
            {r.reservationType === "PAID" && r.depositPaid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                <CreditCard size={10} /> Paid
              </span>
            )}
            {r.reservationType === "FREE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600">
                10% off
              </span>
            )}
            {r.allocationScore ? (
              <ScoreBreakdownCard score={r.allocationScore} compact />
            ) : r.slotCode ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <Sparkles size={10} /> AI-assigned
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {r.buildingName || ""}
              {r.reservationType === "PAID" && !r.depositPaid
                ? " › slot confirms after payment"
                : r.floorName ? ` › ${r.floorName}` : ""}
              {r.reservationType === "PAID" && !r.depositPaid
                ? null
                : r.slotCode ? <> › <span className="nums text-text">{r.slotCode}</span></> : " › AI at check-in"}
            </span>
            {r.reservedStart && (
              <span className="flex items-center gap-1 nums">
                <Clock size={12} /> Arrive by {time(r.reservedStart)}
              </span>
            )}
            {isPending && <span className="nums">held until {time(r.holdUntil)}</span>}
            {r.depositAmount && (
              <span className="nums">deposit {r.depositAmount.toLocaleString()} VND</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {isPending && !(r.reservationType === "PAID" && !r.depositPaid) && (
            <Button variant="secondary" size="sm" onClick={() => setShowQr(!showQr)}>
              <QrCode size={14} /> {showQr ? "Hide" : "QR"}
            </Button>
          )}
          {isPending && (
            <Button variant="secondary" size="sm" onClick={onCancel} loading={cancelling}>
              <X size={14} /> Cancel
            </Button>
          )}
        </div>
      </div>
      {showQr && (
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
          <ReservationQr id={r.id} />
          <span className="text-xs text-muted">Show this QR to staff for check-in</span>
        </div>
      )}
    </Card>
  );
}

function ReservationQr({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { driverApi.reservationQr(id).then(setSrc); }, [id]);
  if (!src) return <div className="h-40 w-40 animate-pulse rounded bg-elevated" />;
  return <img src={src} alt="Reservation QR" className="h-40 w-40 rounded" />;
}

function AvailabilityBar({ buildings }) {
  const [avail, setAvail] = useState({});
  useEffect(() => {
    if (buildings.length === 0) return;
    Promise.all(buildings.map(b => publicApi.availability(b.id).then(a => [b.id, a]).catch(() => [b.id, null])))
      .then(entries => setAvail(Object.fromEntries(entries)));
  }, [buildings]);

  if (buildings.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
        <Building2 size={16} className="text-muted" /> Slot availability
      </h2>
      <div className="space-y-2">
        {buildings.map((b) => {
          const a = avail[b.id];
          const total = a?.totalSlots ?? 0;
          const open = a?.availableSlots ?? 0;
          const pct = total > 0 ? Math.round((open / total) * 100) : 0;
          return (
            <div key={b.id} className="rounded-[var(--radius)] border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.name}</span>
                <span className="nums text-xs text-muted">{a ? `${open}/${total} open` : "..."}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-elevated overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 50 ? "var(--available)" : pct > 20 ? "var(--reserved)" : "var(--occupied)",
                  }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
