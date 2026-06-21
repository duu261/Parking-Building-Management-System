import { useEffect, useState } from "react";
import { Banknote, Building2, Car, Gauge, TrendingUp, Clock, IdCard } from "lucide-react";
import { Card, Spinner, Alert, StatusBadge } from "../../components/ui";
import { AreaLine } from "../../components/charts";
import { managerApi, staffApi } from "../../lib/endpoints";

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n ?? 0);
const dayLabel = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });

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
    ])
      .then(([buildings, daily, revenue, active, passes]) =>
        setData({ buildings, daily, revenue, active, passes }),
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

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted">Last 30 days at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Banknote} label="Revenue (30d)" value={money(monthTotal)} />
        <Stat icon={Car} label="Sessions (30d)" value={monthSessions} />
        <Stat icon={Gauge} label="Avg / day" value={money(avgPerDay)} />
        <Stat icon={Building2} label="Buildings" value={data.buildings.length} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stat icon={TrendingUp} label="Active sessions now" value={data.active?.length ?? 0} accent />
        <Stat icon={IdCard} label="Active monthly passes" value={activePasses} />
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Gauge size={16} className="text-muted" />
          <h2 className="text-sm font-semibold tracking-tight">Daily revenue</h2>
        </div>
        <AreaLine
          format={money}
          data={points.map((p) => ({ label: dayLabel(p.date), value: Number(p.total) }))}
        />
      </Card>

      {data.active?.length > 0 && (
        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={16} className="text-muted" />
            <h2 className="text-sm font-semibold tracking-tight">
              Active sessions ({data.active.length})
            </h2>
          </div>
          <div className="divide-y divide-line text-sm">
            {data.active.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-2">
                <span className="nums font-medium">{s.licensePlate}</span>
                <span className="text-muted">{s.vehicleTypeName}</span>
                <span className="ml-auto text-xs text-muted">
                  {new Date(s.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {data.active.length > 8 && (
              <p className="pt-2 text-xs text-muted">+{data.active.length - 8} more</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        {Icon && <Icon size={15} />} {label}
      </div>
      <div className={`mt-2 nums text-2xl font-semibold tracking-tight ${accent ? "text-available" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
