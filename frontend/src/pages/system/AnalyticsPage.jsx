import { useEffect, useState } from "react";
import { Sparkles, Hand } from "lucide-react";
import { Card, Select, Spinner, Alert } from "../../components/ui";
import { Bars, HorizontalBars, AreaLine } from "../../components/charts";
import { managerApi } from "../../lib/endpoints";

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function windowFor(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return [from.toISOString(), to.toISOString()];
}

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const mins = (n) => `${Math.round(Number(n ?? 0))}m`;
const dayLabel = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });

function ChartCard({ title, hint, children }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    const [from, to] = windowFor(days);
    Promise.all([
      managerApi.revenueDaily(from, to),
      managerApi.revenueByType(from, to),
      managerApi.checkInsByHour(from, to),
      managerApi.durationByType(from, to),
      managerApi.allocationComparison(from, to),
    ])
      .then(([daily, byType, hourly, duration, alloc]) =>
        setData({ daily, byType, hourly, duration, alloc }),
      )
      .catch((e) => setError(e.message));
  }, [days]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Revenue, demand, and allocation insight.</p>
        </div>
        <div className="w-44">
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.days} value={r.days}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {!data ? (
        <div className="mt-10">
          <Spinner label="Loading analytics" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <ChartCard title="Daily revenue" hint="Settled payments per day in the window.">
            <AreaLine
              format={money}
              data={data.daily.points.map((p) => ({ label: dayLabel(p.date), value: Number(p.total) }))}
            />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue by vehicle type" hint="Where the money comes from.">
              <HorizontalBars
                format={money}
                data={data.byType.points.map((p) => ({ label: p.vehicleType, value: Number(p.total) }))}
              />
            </ChartCard>
            <ChartCard title="Avg parked duration" hint="Minutes parked, by vehicle type.">
              <HorizontalBars
                format={mins}
                data={data.duration.points.map((p) => ({
                  label: p.vehicleType,
                  value: Number(p.avgMinutes),
                }))}
              />
            </ChartCard>
          </div>

          <ChartCard title="Check-ins by hour" hint="Peak-hour demand across 0-23h (RQ4).">
            <Bars
              data={data.hourly.points.map((p) => ({ label: p.hour, value: Number(p.count) }))}
            />
          </ChartCard>

          <ChartCard
            title="Auto vs manual allocation"
            hint="Does auto-allocation park drivers faster? (RQ2)"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AllocStat
                icon={Sparkles}
                label="Auto-allocated"
                count={data.alloc.autoCount}
                avg={data.alloc.autoAvgMinutes}
              />
              <AllocStat
                icon={Hand}
                label="Manual pick"
                count={data.alloc.manualCount}
                avg={data.alloc.manualAvgMinutes}
              />
            </div>
            <EffectivenessCallout auto={data.alloc.autoAvgMinutes} manual={data.alloc.manualAvgMinutes} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function AllocStat({ icon: Icon, label, count, avg }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        {Icon && <Icon size={16} />} {label}
      </div>
      <div className="mt-3 nums text-2xl font-semibold">{count}</div>
      <div className="text-xs text-muted">sessions</div>
      <div className="mt-2 nums text-sm">
        {Math.round(Number(avg ?? 0))}m <span className="text-muted">avg duration</span>
      </div>
    </div>
  );
}

function EffectivenessCallout({ auto, manual }) {
  const a = Number(auto ?? 0);
  const m = Number(manual ?? 0);
  if (a <= 0 || m <= 0) return null;
  const diff = m - a;
  const pct = Math.round((Math.abs(diff) / m) * 100);
  const faster = diff > 0;
  return (
    <div className={`mt-4 flex items-center gap-2 rounded-[var(--radius)] px-4 py-3 text-sm font-medium ${faster ? "bg-available/10 text-available" : "bg-elevated text-muted"}`}>
      <Sparkles size={16} />
      {faster
        ? `Auto-allocation parks drivers ${pct}% faster (${Math.round(diff)}m less) than manual choice.`
        : `Auto and manual allocation perform within ${pct}% — no significant difference this window.`}
    </div>
  );
}
