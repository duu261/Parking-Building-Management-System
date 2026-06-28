import { useEffect, useState, useMemo } from "react";
import { QrCode, Clock, BarChart3, Car, Building2, DollarSign, IdCard } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi, publicApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";
import SlotMap from "../../components/SlotMap";

function LiveCost({ sessionId, checkInAt }) {
  const [est, setEst] = useState(null);
  useEffect(() => {
    const fetch = () => driverApi.sessionEstimate(sessionId).then(r => setEst(r.estimate)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [sessionId]);
  const elapsed = Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60000);
  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <Clock size={12} className="shrink-0" />
      <span className="nums">{h}h {m}m</span>
      <span className="text-muted/60">·</span>
      <span>
        Est. <span className="nums font-medium text-text">{est !== null ? money(est) : "..."}</span>
      </span>
    </span>
  );
}

function TicketQr({ id }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    driverApi
      .ticketBlob(id)
      .then((u) => {
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => setFailed(true));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [id]);

  if (failed) {
    return <div className="flex aspect-square w-32 items-center justify-center rounded bg-elevated text-xs text-muted">QR unavailable</div>;
  }
  if (!url) return <div className="aspect-square w-32 animate-pulse rounded bg-elevated" />;
  return (
    <img src={url} alt={`Ticket QR for session ${id}`} className="block w-32 aspect-square" />
  );
}

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MyParkingPage() {
  const [sessions, setSessions] = useState(null);
  const [pricingMap, setPricingMap] = useState({});
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    driverApi.sessions()
      .then((s) => setSessions(s))
      .catch((e) => setError(e.message));

    publicApi.pricing().then((list) => {
      setPricingMap(Object.fromEntries(list.map((p) => [p.vehicleTypeId, p])));
    }).catch(() => {});

    driverApi.passes().then(setPasses).catch(() => {});
  };

  useEffect(load, []);

  const activePasses = useMemo(
    () => passes.filter((p) => p.status === "ACTIVE"),
    [passes],
  );

  const hasCoveringPass = (session) =>
    activePasses.some(
      (p) => p.licensePlate === session.licensePlate && p.vehicleTypeId === session.vehicleTypeId,
    );

  const active = useMemo(
    () => (sessions ?? []).filter((s) => s.status === "ACTIVE"),
    [sessions],
  );
  const awaitingPayment = useMemo(
    () => (sessions ?? []).filter((s) => s.status === "AWAITING_PAYMENT"),
    [sessions],
  );

  const insights = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    const completed = sessions.filter((s) => s.status === "COMPLETED");
    const totalSpent = completed.reduce((sum, s) => sum + (s.amountCharged ?? 0), 0);
    const durations = completed
      .filter((s) => s.checkInAt && s.checkOutAt)
      .map((s) => (new Date(s.checkOutAt) - new Date(s.checkInAt)) / 60000);
    const avgMin = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const buildings = {};
    sessions.forEach((s) => { if (s.buildingName) buildings[s.buildingName] = (buildings[s.buildingName] || 0) + 1; });
    const topBuilding = Object.entries(buildings).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    const plates = [...new Set(sessions.map((s) => s.licensePlate).filter(Boolean))];
    return { total: sessions.length, totalSpent, avgMin, topBuilding, plates };
  }, [sessions]);

  if (error && sessions === null) return <Alert>{error}</Alert>;
  if (sessions === null) return <Spinner label="Loading your parking" />;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">Your parking at a glance.</p>
        </div>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {/* Summary strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={Car} label="Active sessions" value={active.length} />
        <SummaryCard icon={DollarSign} label="Unpaid" value={awaitingPayment.length} accent={awaitingPayment.length > 0} />
        <SummaryCard icon={IdCard} label="Active passes" value={activePasses.length} />
        <SummaryCard icon={BarChart3} label="Total visits" value={insights?.total ?? 0} />
      </div>

      {active.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={QrCode}
            title="Not parked right now"
            hint="When staff checks you in, your active session appears here with a live cost tracker."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* Main column — Active sessions */}
          <div className="space-y-3 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Car size={16} className="text-muted" /> Active sessions{" "}
              <span className="text-xs font-normal text-muted">({active.length})</span>
            </h2>
            <div className="space-y-3">
              {active.map((s) => (
                <ActiveSessionCard key={s.id} session={s} hasCoveringPass={hasCoveringPass(s)} />
              ))}
            </div>
          </div>

          {/* Side column — Unpaid charges + Monthly passes */}
          <aside className="space-y-4">
            {awaitingPayment.length > 0 && (
              <section>
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <DollarSign size={16} className="text-locked" /> Unpaid charges
                </h2>
                <div className="space-y-2.5">
                  {awaitingPayment.map((s) => (
                    <UnpaidCard key={s.id} session={s} onPaid={load} />
                  ))}
                </div>
              </section>
            )}

            {activePasses.length > 0 && (
              <section>
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <IdCard size={16} className="text-available" /> Active passes
                </h2>
                <div className="space-y-2.5">
                  {activePasses.map((p) => (
                    <PassCard key={p.id} pass={p} />
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}

      {/* Parking insights */}
      {insights && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <BarChart3 size={16} className="text-muted" /> Parking insights
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Car} label="Total visits" value={insights.total} />
            <StatCard icon={DollarSign} label="Total spent" value={money(insights.totalSpent)} />
            <StatCard icon={Clock} label="Avg. duration" value={insights.avgMin > 0 ? `${Math.floor(insights.avgMin / 60)}h ${insights.avgMin % 60}m` : "-"} />
            <StatCard icon={Building2} label="Most visited" value={insights.topBuilding} />
          </div>
          {insights.plates.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-2 text-xs font-medium text-muted">
                Your vehicles <span className="text-muted/60">({insights.plates.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {insights.plates.slice(0, 4).map((p) => (
                  <span key={p} className="nums inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium">
                    <Car size={12} className="text-muted" /> {p}
                  </span>
                ))}
                {insights.plates.length > 4 && (
                  <span className="inline-flex items-center rounded-md border border-line bg-elevated px-2 py-1 text-xs text-muted">
                    +{insights.plates.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Floor & slot availability */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Building2 size={16} className="text-muted" /> Floor &amp; slot availability
        </h2>
        <SlotMap />
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-elevated">
        <Icon size={15} className={accent ? "text-locked" : "text-muted"} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className={`nums mt-0.5 text-lg font-semibold ${accent ? "text-locked" : ""}`}>{value}</div>
      </div>
    </Card>
  );
}

function ActiveSessionCard({ session: s, hasCoveringPass: covered }) {
  const [showQr, setShowQr] = useState(false);
  return (
    <Card className="overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="nums text-sm font-semibold">{s.licensePlate}</span>
              <StatusBadge status={s.status} />
              {s.fromReservation && !s.depositCredit && (
                <span className="rounded-full bg-available/10 px-2 py-0.5 text-xs font-medium text-available">10% off</span>
              )}
              {s.fromReservation && s.depositCredit > 0 && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{money(s.depositCredit)} deposit</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {s.buildingName} › {s.floorName} › <span className="nums text-text">{s.slotCode}</span>
              </span>
              <span className="nums">in {time(s.checkInAt)}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowQr(!showQr)}>
            <QrCode size={13} /> {showQr ? "Hide" : "Ticket"}
          </Button>
        </div>

        {covered ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-available/20 bg-available/[0.06] px-2.5 py-1.5">
            <IdCard size={13} className="text-available shrink-0" />
            <span className="text-xs font-medium text-available">Monthly pass active · Free checkout</span>
          </div>
        ) : (
          <div className="mt-2">
            <LiveCost sessionId={s.id} checkInAt={s.checkInAt} />
          </div>
        )}

        {showQr && (
          <div className="mt-2.5 flex items-center gap-4 border-t border-line pt-2.5">
            <TicketQr id={s.id} />
            <div className="text-xs text-muted">
              <p>Show this QR to staff at exit</p>
              {s.ticketCode && <p className="mt-1 nums select-all text-text">{s.ticketCode}</p>}
            </div>
          </div>
        )}
        {!showQr && s.allocationScore && (
          <div className="mt-2.5">
            <ScoreBreakdownCard score={s.allocationScore} />
          </div>
        )}
      </div>
    </Card>
  );
}

function UnpaidCard({ session: s, onPaid }) {
  const [loading, setLoading] = useState(false);
  const pay = async () => {
    setLoading(true);
    try {
      const res = await driverApi.vnpay(s.paymentId);
      window.location.href = res.paymentUrl;
    } catch { setLoading(false); }
  };
  return (
    <Card className="overflow-hidden">
      <div className="border-l-[3px] border-l-locked p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="nums text-sm font-semibold">{s.licensePlate}</span>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              <span>{s.buildingName} › {s.slotCode}</span>
              <span className="nums">{time(s.checkInAt)} → {time(s.checkOutAt)}</span>
            </div>
            {s.fromReservation && (
              <div className="mt-1 text-xs text-muted">
                {!s.depositCredit ? (
                  <span className="text-available">10% off applied</span>
                ) : (
                  <span className="text-accent">{money(s.depositCredit)} deposit credited</span>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="nums text-base font-semibold">{money(s.amountCharged)}</div>
            <Button size="sm" onClick={pay} loading={loading} className="mt-1.5">
              Pay via VNPay
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PassCard({ pass: p }) {
  return (
    <Card className="flex items-center gap-3 border-available/20 bg-available/[0.04] px-3.5 py-3">
      <IdCard size={18} className="text-available shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="nums text-sm font-semibold">{p.licensePlate}</div>
        <div className="text-xs text-muted">{p.vehicleTypeName} · until {p.validUntil}</div>
      </div>
      <span className="shrink-0 rounded-full bg-available/15 px-2 py-0.5 text-xs font-medium tracking-wide text-available">
        FREE CHECKOUT
      </span>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-elevated">
          <Icon size={16} className="text-muted" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted">{label}</div>
          <div className="nums mt-0.5 text-lg font-semibold truncate">{value}</div>
        </div>
      </div>
    </Card>
  );
}
