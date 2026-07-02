import { useEffect, useState } from "react";
import { Star, MessageSquareText, ThumbsUp, AlertCircle, Filter, User } from "lucide-react";
import { managerApi } from "../../lib/endpoints";
import { Card, Spinner, EmptyState } from "../../components/ui";

const SENTIMENT = { 5: "Positive", 4: "Good", 3: "Neutral", 2: "Needs attention", 1: "Needs attention" };
const SENTIMENT_COLOR = { 5: "text-available", 4: "text-available", 3: "text-muted", 2: "text-occupied", 1: "text-occupied" };

export default function FeedbackPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    managerApi
      .feedback()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const avg =
    rows.length > 0
      ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
      : "\u2014";

  const highCount = rows.filter((r) => r.rating >= 4).length;
  const lowCount = rows.filter((r) => r.rating <= 2).length;

  const filtered = filterRating > 0 ? rows.filter((r) => r.rating === filterRating) : rows;

  const counts = {};
  [5, 4, 3, 2, 1].forEach((n) => {
    counts[n] = rows.filter((r) => r.rating === n).length;
  });

  return (
    <div className="mx-auto max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface">
          <MessageSquareText size={18} className="text-muted" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Driver feedback</h1>
          <p className="mt-0.5 text-sm text-muted">Review sentiment and driver comments after parking sessions.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-occupied">{error}</p>}
      {loading && <Spinner label="Loading feedback" />}

      {/* ── Summary cards ── */}
      {!loading && rows.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <SummaryCard icon={Star} label="Avg rating" value={avg} />
          <SummaryCard icon={MessageSquareText} label="Total reviews" value={rows.length} />
          <SummaryCard icon={ThumbsUp} label="4–5 stars" value={highCount} accent={highCount > 0} />
          <SummaryCard icon={AlertCircle} label="Needs attention" value={lowCount} accent={lowCount > 0} alert />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && rows.length === 0 && (
        <div className="mt-10">
          <EmptyState icon={MessageSquareText} title="No feedback yet" hint="Driver feedback will appear here after parking sessions." />
        </div>
      )}

      {/* ── Filter bar ── */}
      {!loading && rows.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Filter size={12} />
            <span>Filter by rating</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip
              label="All"
              count={rows.length}
              active={filterRating === 0}
              onClick={() => setFilterRating(0)}
            />
            {[5, 4, 3, 2, 1].map((n) => (
              <FilterChip
                key={n}
                label={`${n} star${n > 1 ? "s" : ""}`}
                count={counts[n]}
                active={filterRating === n}
                onClick={() => setFilterRating(filterRating === n ? 0 : n)}
                star
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Filtered empty state ── */}
      {!loading && filtered.length === 0 && rows.length > 0 && (
        <div className="mt-8">
          <EmptyState icon={Star} title="No matches" hint={`No feedback with this rating. Try a different filter.`} />
        </div>
      )}

      {/* ── Feedback list ── */}
      {filtered.length > 0 && (
        <div className="mt-6 space-y-3">
          {filtered.map((fb) => {
            const sentiment = SENTIMENT[fb.rating] ?? "Unknown";
            const sentimentColor = SENTIMENT_COLOR[fb.rating] ?? "text-muted";
            return (
              <Card
                key={fb.id}
                className={`p-5 transition hover:bg-elevated/30 ${fb.rating <= 2 ? "border-occupied/15" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Stars value={fb.rating} />
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${sentimentColor} ${fb.rating >= 4 ? "border-available/20 bg-available/8" : fb.rating === 3 ? "border-line bg-elevated" : "border-occupied/20 bg-occupied/8"}`}>
                      {fb.rating <= 2 && <AlertCircle size={10} />}
                      {sentiment}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(fb.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <User size={13} className="text-muted" />
                  <span className="text-sm font-medium">{fb.driverName ?? "Anonymous"}</span>
                  <span className="text-xs text-muted">
                    #{fb.sessionId} · {fb.licensePlate}
                  </span>
                </div>
                {fb.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-muted border-l-2 border-line pl-3">{fb.comment}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, alert }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${alert ? "border-occupied/20 bg-occupied/8" : "border-line bg-elevated"}`}>
          <Icon size={13} className={alert ? "text-occupied" : ""} />
        </div>
        {label}
      </div>
      <p className={`mt-2 nums text-2xl font-semibold tracking-tight ${accent && !alert ? "text-available" : ""} ${alert ? "text-occupied" : ""}`}>
        {value}
      </p>
    </Card>
  );
}

function FilterChip({ label, count, active, onClick, star }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
        active
          ? "border-accent bg-accent text-accent-fg"
          : "border-line bg-surface text-muted hover:bg-elevated hover:text-text"
      }`}
    >
      {star && <Star size={11} className={active ? "fill-current" : "fill-amber-400 text-amber-400"} />}
      {label}
      <span className={`ml-0.5 ${active ? "opacity-70" : "text-muted/60"}`}>({count})</span>
    </button>
  );
}

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= value ? "text-amber-400 fill-amber-400" : "text-muted/30"}
        />
      ))}
    </div>
  );
}
