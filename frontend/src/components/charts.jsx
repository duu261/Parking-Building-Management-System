// Lightweight charts in the Control Room language: graphite ink on the page,
// no color (color is reserved for slot/session status elsewhere). Pure SVG/CSS,
// no charting dependency. ponytail: a few divs and one polyline beat recharts here.
import { EmptyState } from "./ui";
import { BarChart3 } from "lucide-react";

const identity = (v) => v;

function isEmpty(data) {
  return !data || data.length === 0 || data.every((d) => !d.value);
}

export function HorizontalBars({ data, format = identity }) {
  if (isEmpty(data)) return <EmptyState icon={BarChart3} title="No data yet" />;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="nums text-muted">{format(d.value)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${max ? Math.max((d.value / max) * 100, 3) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Vertical bars. data: [{ label, value }]. Good for hourly, by-type, duration.
export function Bars({ data, format = identity, height = 160 }) {
  if (isEmpty(data)) {
    return <EmptyState icon={BarChart3} title="No data" hint="Nothing recorded in this window." />;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
          <span className="nums text-[10px] text-muted">
            {format(d.value)}
          </span>
          <div
            className="w-full rounded-t-[3px] bg-accent transition group-hover:opacity-80"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, minHeight: d.value ? 4 : 0 }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="nums text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Filled line for a time trend. data: [{ label, value }].
export function AreaLine({ data, format = identity, height = 180 }) {
  if (isEmpty(data)) {
    return <EmptyState icon={BarChart3} title="No data" hint="Nothing recorded in this window." />;
  }
  const w = 600;
  const h = height;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const x = (i) => pad + (i * (w - 2 * pad)) / Math.max(data.length - 1, 1);
  const y = (v) => h - pad - (v / max) * (h - 2 * pad);
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <polygon points={area} fill="var(--text)" opacity="0.06" />
        <polyline points={line} fill="none" stroke="var(--text)" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="2.5" fill="var(--surface)"
            stroke="var(--text)" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
            <title>{`${d.label}: ${format(d.value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between nums text-[10px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
