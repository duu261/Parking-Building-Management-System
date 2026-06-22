import { useEffect, useState, useMemo } from "react";
import { QrCode, MapPin, Clock, BarChart3, Car, Building2, DollarSign, IdCard } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi, publicApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";
import SlotMap from "../../components/SlotMap";

function estimateCharge(checkInIso, pricing) {
  if (!pricing) return null;
  const now = Date.now();
  const checkIn = new Date(checkInIso).getTime();
  const totalMinutes = Math.floor((now - checkIn) / 60000);
  const billable = totalMinutes - (pricing.graceMinutes ?? 0);
  if (billable <= 0) return 0;
  const hours = Math.ceil(billable / 60);
  let amount = (pricing.ratePerHour ?? 0) * hours;
  if (pricing.dailyCap) {
    const days = Math.max(1, Math.ceil(totalMinutes / 1440));
    const cap = pricing.dailyCap * days;
    if (amount > cap) amount = cap;
  }
  const peak = pricing.peakMultiplier ?? 1;
  return amount * peak;
}

function LiveCost({ checkInAt, vehicleTypeId, pricingMap }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const pricing = pricingMap?.[vehicleTypeId];
  const est = useMemo(() => estimateCharge(checkInAt, pricing), [checkInAt, pricing, tick]);
  if (est === null) return null;
  const elapsed = Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60000);
  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-[var(--radius)] border border-line bg-elevated/60 px-4 py-2.5">
      <Clock size={14} className="text-muted shrink-0" />
      <div className="flex-1 text-sm">
        <span className="text-muted">Elapsed </span>
        <span className="nums font-medium">{h}h {m}m</span>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-muted">Est. cost</div>
        <div className="nums text-sm font-semibold">{money(est)}</div>
      </div>
    </div>
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
    return <div className="w-40 aspect-square flex items-center justify-center rounded bg-elevated text-[11px] text-muted">QR unavailable</div>;
  }
  if (!url) return <div className="w-40 aspect-square animate-pulse rounded bg-elevated" />;
  return (
    <img src={url} alt={`Ticket QR for session ${id}`} className="block w-40 aspect-square" />
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
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Your active parking at a glance.</p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {active.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={QrCode}
            title="Not parked right now"
            hint="When staff checks you in, your active session appears here with a live cost tracker."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {active.map((s) => (
            <ActiveSessionCard key={s.id} session={s} hasCoveringPass={hasCoveringPass(s)} pricingMap={pricingMap} />
          ))}
        </div>
      )}

      {activePasses.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <IdCard size={16} className="text-available" /> Active monthly passes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {activePasses.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 border-available/30 bg-available/5 p-4">
                <IdCard size={20} className="text-available shrink-0" />
                <div className="min-w-0">
                  <div className="nums text-sm font-semibold">{p.licensePlate}</div>
                  <div className="text-xs text-muted">{p.vehicleTypeName} · until {p.validUntil}</div>
                </div>
                <span className="ml-auto rounded-full bg-available/20 px-2 py-0.5 text-[11px] font-medium text-available">
                  FREE CHECKOUT
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {insights && (
        <section className="mt-8">
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
            <div className="mt-4">
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

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Building2 size={16} className="text-muted" /> Floor &amp; slot availability
        </h2>
        <SlotMap />
      </section>
    </div>
  );
}

function ActiveSessionCard({ session: s, hasCoveringPass: covered, pricingMap }) {
  const [showQr, setShowQr] = useState(false);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="nums text-[15px] font-semibold">{s.licensePlate}</span>
            <StatusBadge status={s.status} />
            {s.autoAllocated && <ScoreBreakdownCard score={s.allocationScore} compact />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Building2 size={13} /> {s.buildingName} › {s.floorName} › <span className="nums text-text">{s.slotCode}</span>
            </span>
            <span className="nums">in {time(s.checkInAt)}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowQr(!showQr)}>
          <QrCode size={14} /> {showQr ? "Hide" : "Ticket"}
        </Button>
      </div>
      {covered ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-available/30 bg-available/10 px-3 py-2">
          <IdCard size={15} className="text-available" />
          <span className="text-sm font-medium text-available">Monthly pass active · Free checkout</span>
        </div>
      ) : (
        <LiveCost checkInAt={s.checkInAt} vehicleTypeId={s.vehicleTypeId} pricingMap={pricingMap} />
      )}
      {showQr && (
        <div className="mt-3 flex items-center gap-4 border-t border-line pt-3">
          <TicketQr id={s.id} />
          <div className="text-xs text-muted">
            <p>Show this QR to staff at exit</p>
            {s.ticketCode && <p className="mt-1 nums select-all text-text">{s.ticketCode}</p>}
          </div>
        </div>
      )}
      {!showQr && s.allocationScore && (
        <div className="mt-3">
          <ScoreBreakdownCard score={s.allocationScore} />
        </div>
      )}
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
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
