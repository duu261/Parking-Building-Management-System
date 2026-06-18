import { useEffect, useState } from "react";
import { DollarSign, Building2, Car, Gauge } from "lucide-react";
import { Card, Spinner, Alert } from "../../components/ui";
import { AreaLine } from "../../components/charts";
import { managerApi } from "../../lib/endpoints";

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
    Promise.all([managerApi.buildings(), managerApi.revenueDaily(from, to)])
      .then(([buildings, daily]) => setData({ buildings, daily }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading overview" />;

  const points = data.daily.points;
  const monthTotal = points.reduce((sum, p) => sum + Number(p.total), 0);
  const monthSessions = points.reduce((sum, p) => sum + Number(p.count), 0);
  const avgPerDay = points.length ? monthTotal / points.length : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted">Last 30 days at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Revenue (30d)" value={money(monthTotal)} />
        <Stat icon={Car} label="Paid sessions (30d)" value={monthSessions} />
        <Stat icon={Gauge} label="Avg / day" value={money(avgPerDay)} />
        <Stat icon={Building2} label="Buildings" value={data.buildings.length} />
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
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        {Icon && <Icon size={15} />} {label}
      </div>
      <div className="mt-2 nums text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}
