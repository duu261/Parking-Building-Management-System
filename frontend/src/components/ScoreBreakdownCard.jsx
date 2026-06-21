import { Sparkles } from "lucide-react";

const CRITERIA = [
  { key: "vehicleTypeMatch", label: "Vehicle type match", max: 40 },
  { key: "loadBalance", label: "Floor load balance", max: 30 },
  { key: "distanceToEntry", label: "Distance to entry", max: 20 },
  { key: "peakHour", label: "Peak-hour bonus", max: 10 },
];

export default function ScoreBreakdownCard({ score, compact = false }) {
  if (!score) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
        <Sparkles size={10} /> AI pick · {score.total}/100
      </span>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-accent">
          <Sparkles size={12} /> AI-optimized
        </span>
        <span className="nums text-sm font-semibold text-accent">{score.total}/100</span>
      </div>

      {score.alternativesConsidered > 1 && (
        <p className="mt-1.5 text-xs text-muted">
          Scored {score.alternativesConsidered} slots, picked the best one.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {CRITERIA.map(({ key, label, max }) => (
          <div key={key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted">{label}</span>
              <span className="nums text-text">{score[key]}/{max}</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (score[key] / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
