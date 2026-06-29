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
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium">{d.label}</span>
            <span className="nums shrink-0 text-muted">{format(d.value)}</span>
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

export function Bars({ data, format = identity, height = 220 }) {
  if (isEmpty(data)) {
    return <EmptyState icon={BarChart3} title="No data" hint="Nothing recorded in this window." />;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const barZone = height - 40;
  const count = data.length;
  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="flex items-end gap-1.5"
        style={{ height, minWidth: count > 12 ? Math.max(count * 26, 320) : undefined }}
      >
        {data.map((d, i) => {
          const h = d.value ? Math.max((d.value / max) * barZone, 4) : 0;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
              <span className="nums text-xs text-muted">
                {format(d.value)}
              </span>
              <div
                className="w-full rounded-t-[3px] bg-accent transition group-hover:opacity-80"
                style={{ height: h }}
                title={`${d.label}: ${format(d.value)}`}
              />
              <span className="nums text-xs text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AreaLine({ data, format = identity, height = 180 }) {
  if (isEmpty(data)) {
    return <EmptyState icon={BarChart3} title="No data" hint="Nothing recorded in this window." />;
  }
  const w = 600;
  const h = height;
  const padL = 65;
  const padR = 8;
  const padT = 10;
  const padB = 8;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const count = data.length;
  const x = (i) => padL + (i * chartW) / Math.max(count - 1, 1);
  const y = (v) => padT + (1 - v / max) * chartH;
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${padL},${h - padB} ${line} ${w - padR},${h - padB}`;
  const yTicks = [0, 0.33, 0.67, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {yTicks.map((pct) => {
          const yPos = y(max * pct);
          return (
            <g key={pct}>
              <line
                x1={padL} y1={yPos} x2={w - padR} y2={yPos}
                stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={padL - 5} y={yPos}
                textAnchor="end" dominantBaseline="middle"
                fill="var(--muted)" fontSize="9"
                vectorEffect="non-scaling-stroke"
              >
                {format(max * pct)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="var(--text)" opacity="0.06" />
        <polyline points={line} fill="none" stroke="var(--text)" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r="2.5" fill="var(--surface)"
              stroke="var(--text)" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between nums text-xs text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
