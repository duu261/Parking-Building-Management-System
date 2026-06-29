import { useEffect, useState } from "react";
import { Sparkles, Hand, TrendingUp, Car, Clock, Banknote, Activity, Gauge, BarChart3, ArrowUp, Zap } from "lucide-react";
import { Card, Select, Spinner, Alert } from "../../components/ui";
import { AreaLine, Bars, HorizontalBars } from "../../components/charts";
import { managerApi } from "../../lib/endpoints";

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function windowFor(days) {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return [from.toISOString(), to.toISOString()];
}

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const shortMoney = (n) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};
const chartMoney = (n) => `${shortMoney(n)} ₫`;
const mins = (n) => `${Math.round(Number(n ?? 0))}m`;
const dayLabel = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });

function groupByWeek(points) {
  const weeks = {};
  points.forEach((p) => {
    const d = new Date(p.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    const key = monday.getTime();
    if (!weeks[key]) weeks[key] = { date: monday, total: 0 };
    weeks[key].total += Number(p.total);
  });
  return Object.values(weeks)
    .sort((a, b) => a.date - b.date)
    .map((w) => ({ label: dayLabel(w.date.toISOString()), value: w.total }));
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

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading analytics" />;

  const { daily, byType, hourly, duration, alloc } = data;

  const points = daily.points ?? [];
  const monthTotal = points.reduce((s, p) => s + Number(p.total), 0);
  const totalSessions = points.reduce((s, p) => s + Number(p.count), 0);
  const avgPerDay = points.length ? monthTotal / points.length : 0;
  const sessPerDay = points.length ? (totalSessions / points.length).toFixed(1) : "0";

  const revTypes = byType?.points ?? [];
  const topType = revTypes.length ? revTypes.reduce((a, b) => (Number(a.total) > Number(b.total) ? a : b)) : null;

  const hourPoints = hourly?.points ?? [];
  const peakHour = hourPoints.length ? hourPoints.reduce((a, b) => (Number(a.count) > Number(b.count) ? a : b)) : null;

  const durPoints = duration?.points ?? [];
  const longestDuration = durPoints.length ? durPoints.reduce((a, b) => (Number(a.avgMinutes) > Number(b.avgMinutes) ? a : b)) : null;
  const avgDurationOverall = durPoints.length
    ? durPoints.reduce((s, p) => s + Number(p.avgMinutes), 0) / durPoints.length
    : 0;

  const auto = Number(alloc?.autoCount ?? 0);
  const manual = Number(alloc?.manualCount ?? 0);
  const allocTotal = auto + manual;
  const aiPct = allocTotal > 0 ? Math.round((auto / allocTotal) * 100) : 0;

  const weeklyData = groupByWeek(points);
  const useWeekly = days > 7 && weeklyData.length <= points.length / 2;
  const chartData = useWeekly ? weeklyData : points.map((p) => ({ label: dayLabel(p.date), value: Number(p.total) }));
  const bestItem = chartData.length ? chartData.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Performance and operational insights for your parking buildings.</p>
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

      {/* ── Key Highlights ── */}
      <div className="mt-6 flex flex-wrap gap-2">
        <HighlightChip icon={Banknote} label="Total revenue" value={shortMoney(monthTotal)} />
        <HighlightChip icon={Car} label="Sessions" value={totalSessions} />
        <HighlightChip icon={Gauge} label="Revenue / day" value={shortMoney(avgPerDay)} />
        <HighlightChip icon={Zap} label="Sessions / day" value={sessPerDay} />
        <HighlightChip icon={Clock} label="Avg duration" value={mins(avgDurationOverall)} />
        {peakHour && <HighlightChip icon={Activity} label="Peak hour" value={`${peakHour.hour}:00`} />}
        {topType && <HighlightChip icon={TrendingUp} label="Top type" value={topType.vehicleType} />}
        {allocTotal > 0 && (
          <HighlightChip
            icon={Sparkles}
            label="AI adoption"
            value={`${aiPct}%`}
            accent={aiPct >= 50}
          />
        )}
      </div>

      {/* ── Revenue Trend ── */}
      <Card className="mt-8 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
              <TrendingUp size={15} className="text-muted" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Revenue trend</h2>
              <p className="text-xs text-muted">
                {useWeekly
                  ? `Weekly revenue over ${RANGES.find((r) => r.days === days)?.label.toLowerCase()}`
                  : `Daily revenue over the last ${days} days`}
              </p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="nums text-lg font-semibold">{money(monthTotal)}</p>
            <p className="text-xs text-muted">{totalSessions} sessions</p>
          </div>
        </div>
        {bestItem && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-available/20 bg-available/8 px-2.5 py-1 text-xs text-available">
              <ArrowUp size={11} />
              {useWeekly ? "Best week" : "Best day"}: {bestItem.label} · {money(bestItem.value)}
            </span>
          </div>
        )}
        <div className="mt-4">
          <AreaLine
            format={chartMoney}
            height={chartData.length > 10 ? 140 : 180}
            data={chartData}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <Metric label="Total" value={money(monthTotal)} />
          <Metric label="Daily avg" value={money(avgPerDay)} />
          <Metric label="Sessions" value={totalSessions} />
          <Metric label="Days" value={points.length} />
          {useWeekly && <Metric label="Weeks" value={weeklyData.length} />}
        </div>
      </Card>

      {/* ── Vehicle Performance ── */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-elevated">
            <Car size={13} className="text-muted" />
          </span>
          <h2 className="text-sm font-semibold">Vehicle performance</h2>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <ChartCard icon={Banknote} title="Revenue by type" hint="Share of total revenue"
            insight={topType ? `${topType.vehicleType} leads with ${money(topType.total)}` : null}
          >
            <HorizontalBars
              format={money}
              data={revTypes.map((p) => ({ label: p.vehicleType, value: Number(p.total) }))}
            />
          </ChartCard>
          <ChartCard icon={Clock} title="Avg parked duration" hint="Minutes by vehicle type"
            insight={longestDuration ? `${longestDuration.vehicleType}: ${mins(longestDuration.avgMinutes)} longest` : null}
          >
            <HorizontalBars
              format={mins}
              data={durPoints.map((p) => ({
                label: p.vehicleType,
                value: Number(p.avgMinutes),
              }))}
            />
          </ChartCard>
        </div>
      </div>

      {/* ── Operational Insights ── */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-elevated">
            <Activity size={13} className="text-muted" />
          </span>
          <h2 className="text-sm font-semibold">Operational insights</h2>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {/* Check-ins by hour */}
          <Card className="min-w-0 p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
                <BarChart3 size={15} className="text-muted" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Check-ins by hour</h3>
                <p className="text-xs text-muted">Active hours 06:00–22:00</p>
              </div>
            </div>
            {peakHour && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-3 py-1.5 text-xs">
                <ArrowUp size={12} className="text-available" />
                Peak at <span className="nums font-medium">{peakHour.hour}:00</span> —{" "}
                <span className="nums font-medium">{peakHour.count}</span> check-ins
              </div>
            )}
            <div className="mt-4">
              <Bars
                height={160}
                data={hourPoints.filter((p) => Number(p.hour) >= 6 && Number(p.hour) <= 22).map((p) => ({ label: String(p.hour), value: Number(p.count) }))}
              />
            </div>
          </Card>

          {/* Auto vs Manual */}
          <Card className="min-w-0 p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
                <Sparkles size={15} className="text-muted" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Allocation method</h3>
                <p className="text-xs text-muted">Auto vs manual slot selection</p>
              </div>
            </div>
            {allocTotal > 0 ? (
              <>
                <div className="mt-5 space-y-4">
                  <AllocRow
                    icon={Sparkles}
                    label="Auto-allocated"
                    count={auto}
                    total={allocTotal}
                    avg={alloc.autoAvgMinutes}
                    dominant={aiPct >= 50}
                  />
                  <AllocRow
                    icon={Hand}
                    label="Manual pick"
                    count={manual}
                    total={allocTotal}
                    avg={alloc.manualAvgMinutes}
                    dominant={aiPct < 50}
                  />
                </div>
                <div
                  className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                    aiPct >= 50
                      ? "border border-available/30 bg-available/10 text-available"
                      : "border border-line bg-elevated text-muted"
                  }`}
                >
                  <Sparkles size={16} />
                  {aiPct >= 50
                    ? `${aiPct}% of drivers let the AI pick their slot (${auto} of ${allocTotal} sessions).`
                    : `${aiPct}% of drivers used AI allocation (${auto} of ${allocTotal}) — most still pick manually.`}
                </div>
              </>
            ) : (
              <div className="mt-10 text-center text-sm text-muted">No allocation data available.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ icon: Icon, title, hint, insight, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated">
          <Icon size={15} className="text-muted" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </div>
      {insight && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-3 py-1.5 text-xs">
          <ArrowUp size={12} className="text-available" />
          {insight}
        </div>
      )}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function HighlightChip({ icon: Icon, label, value, accent }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${accent ? "border-available/30 bg-available/10 text-available" : "border-line bg-surface text-muted"}`}>
      {Icon && <Icon size={12} />}
      <span className="text-text/70">{label}:</span>
      <span className={`nums font-medium ${accent ? "text-available" : "text-text"}`}>{value}</span>
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <span className="text-xs text-muted">
      {label}: <span className="nums font-medium text-text">{value}</span>
    </span>
  );
}

function AllocRow({ icon: Icon, label, count, total, avg, dominant }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`rounded-lg border p-4 ${dominant ? "border-available/30 bg-available/[0.04]" : "border-line"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          {Icon && <Icon size={16} />}
          {label}
        </div>
        <span className="nums text-xl font-semibold">{count}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
        <span>{pct}% of total</span>
        <span className="h-3 w-px bg-line" />
        <span>{Math.round(Number(avg ?? 0))}m avg duration</span>
      </div>
    </div>
  );
}
