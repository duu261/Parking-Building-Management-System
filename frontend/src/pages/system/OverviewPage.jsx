import { useEffect, useState } from "react";
import { Banknote, Building2, Car, Gauge, TrendingUp, Clock, IdCard, TriangleAlert, Star, ArrowRight, BarChart3, ListChecks, Activity } from "lucide-react";
import { Card, Spinner, Alert, StatusBadge } from "../../components/ui";
import { managerApi, staffApi } from "../../lib/endpoints";
import SlotMap from "../../components/SlotMap";
import { Link } from "react-router-dom";

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n ?? 0);

function window30() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return [from.toISOString(), to.toISOString()];
}

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const [from, to] = window30();
    Promise.all([
      managerApi.buildings(),
      managerApi.revenueDaily(from, to),
      managerApi.revenue(from, to),
      staffApi.active(),
      managerApi.passes(),
      managerApi.openExceptions().catch(() => []),
      managerApi.feedback().catch(() => []),
    ])
      .then(([buildings, daily, revenue, active, passes, openExc, feedback]) =>
        setData({ buildings, daily, revenue, active, passes, openExc, feedback }),
      )
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading overview" />;

  const points = data.daily.points ?? [];
  const monthTotal = data.revenue?.total ?? points.reduce((s, p) => s + Number(p.total), 0);
  const monthSessions = data.revenue?.sessionCount ?? points.reduce((s, p) => s + Number(p.count), 0);
  const avgPerDay = points.length ? monthTotal / points.length : 0;
  const activePasses = data.passes?.filter((p) => p.status === "ACTIVE").length ?? 0;
  const avgRating =
    data.feedback?.length > 0
      ? (data.feedback.reduce((s, f) => s + f.rating, 0) / data.feedback.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Last 30 days at a glance.</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted sm:inline-flex">
          <Clock size={12} />
          Last 30 days
        </span>
      </div>

      {/* ── KPI: Business Summary ── */}
      <div className="mt-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Business summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Banknote} label="Revenue (30d)" value={money(monthTotal)} />
          <Stat icon={Car} label="Sessions (30d)" value={monthSessions} />
          <Stat icon={Gauge} label="Avg revenue / day" value={money(avgPerDay)} />
          <Stat icon={IdCard} label="Active passes" value={activePasses} />
        </div>
      </div>

      {/* ── KPI: Live Status ── */}
      <div className="mt-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Live status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={TrendingUp}
            label="Active sessions now"
            value={data.active?.length ?? 0}
            accent
          />
          <Stat
            icon={TriangleAlert}
            label="Open exceptions"
            value={data.openExc?.length ?? 0}
            accent={data.openExc?.length > 0}
          />
          <Stat
            icon={Star}
            label="Avg feedback"
            value={avgRating ? `${avgRating} / 5` : "\u2014"}
          />
          <Stat icon={Building2} label="Buildings" value={data.buildings.length} />
        </div>
      </div>

      {/* ── Quick Insights & Actions (replaces chart) ── */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Revenue snapshot */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
              <Banknote size={15} className="text-muted" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Revenue at a glance</h3>
              <p className="text-xs text-muted">30-day performance summary</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Total revenue</p>
              <p className="mt-0.5 nums text-lg font-semibold">{money(monthTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Daily average</p>
              <p className="mt-0.5 nums text-lg font-semibold">{money(avgPerDay)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total sessions</p>
              <p className="mt-0.5 nums text-lg font-semibold">{monthSessions}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Sessions / day</p>
              <p className="mt-0.5 nums text-lg font-semibold">
                {points.length ? (monthSessions / points.length).toFixed(1) : "\u2014"}
              </p>
            </div>
          </div>
          <div className="mt-4 h-px bg-line" />
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Activity size={12} />
            <span>{points.length} days of data recorded</span>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
              <ListChecks size={15} className="text-muted" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Quick actions</h3>
              <p className="text-xs text-muted">Frequent management tasks</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ActionButton
              icon={Banknote}
              label="Manage pricing"
              to="/app/pricing"
            />
            <ActionButton
              icon={TriangleAlert}
              label="Review exceptions"
              to="/app/exceptions"
            />
            <ActionButton
              icon={BarChart3}
              label="View analytics"
              to="/app/analytics"
            />
            <ActionButton
              icon={IdCard}
              label="Manage passes"
              to="/app/passes"
            />
          </div>
        </Card>
      </div>

      {/* ── Active Sessions ── */}
      {data.active?.length > 0 && (
        <Card className="mt-8 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
                <Clock size={15} className="text-muted" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Active sessions</h3>
                <p className="text-xs text-muted">
                  {data.active.length} vehicle{data.active.length !== 1 ? "s" : ""} currently parked
                </p>
              </div>
            </div>
            <Link
              to="/app/analytics"
              className="hidden items-center gap-1 text-xs text-muted transition hover:text-text sm:inline-flex"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {data.active.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex min-w-0 items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated">
                  <Car size={15} className="text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="nums text-sm font-medium">{s.licensePlate}</p>
                  <p className="truncate text-xs text-muted">{s.vehicleTypeName}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs text-muted">Checked in</p>
                  <p className="nums text-xs">
                    {new Date(s.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {data.active.length > 8 && (
              <p className="pt-3 text-center text-xs text-muted">
                +{data.active.length - 8} more active session{data.active.length - 8 !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ── Live Slot Map ── */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
            <Building2 size={15} className="text-muted" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Live slot map</h2>
            <p className="text-xs text-muted">Real-time building occupancy</p>
          </div>
        </div>
        <SlotMap />
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-elevated">
          {Icon && <Icon size={13} />}
        </div>
        <span className="ml-1">{label}</span>
      </div>
      <p className={`mt-3 nums text-2xl font-semibold tracking-tight ${accent ? "text-available" : ""}`}>
        {value}
      </p>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-3 text-sm transition hover:bg-elevated"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
        <Icon size={13} className="text-muted" />
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
