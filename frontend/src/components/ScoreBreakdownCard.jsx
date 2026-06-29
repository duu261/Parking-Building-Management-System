import { Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";

const CRITERIA = [
  { key: "vehicleTypeMatch", label: "Vehicle type match", max: 40 },
  { key: "loadBalance", label: "Floor load balance", max: 30 },
  { key: "distanceToEntry", label: "Distance to entry", max: 20 },
  { key: "peakHour", label: "Peak-hour bonus", max: 10 },
];

export default function ScoreBreakdownCard({ score, compact = false }) {
  const [open, setOpen] = useState(false);
  if (!score) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
        <Sparkles size={10} /> AI pick · {score.total}/100
      </span>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-accent/20 bg-accent/[0.04]">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-accent/[0.03]"
      >
        <Sparkles size={13} className="text-accent shrink-0" />
        <span className="flex-1 text-xs font-medium text-accent">AI-optimized</span>
        <span className="nums text-xs font-semibold text-accent">{score.total}/100</span>
        <ChevronDown size={13} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-accent/15 px-3 pb-3 pt-2">
          {score.alternativesConsidered > 1 && (
            <p className="mb-2 text-xs text-muted">
              Scored {score.alternativesConsidered} slots, picked the best.
            </p>
          )}
          <div className="space-y-1.5">
            {CRITERIA.map(({ key, label, max }) => (
              <div key={key}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted">{label}</span>
                  <span className="nums text-text/80">{score[key]}/{max}</span>
                </div>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, (score[key] / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
