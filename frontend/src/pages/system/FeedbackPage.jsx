import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { managerApi } from "../../lib/endpoints";
import { Card } from "../../components/ui";

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
      : "-";

  const filtered = filterRating > 0 ? rows.filter((r) => r.rating === filterRating) : rows;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Driver feedback</h1>
      <p className="mt-1 text-sm text-muted">
        All feedback submitted by drivers after parking sessions.
      </p>

      {!loading && rows.length > 0 && (
        <div className="mt-4 flex gap-4">
          <Card className="flex-1 p-4 text-center">
            <div className="text-3xl font-bold nums">{avg}</div>
            <div className="mt-1 text-xs text-muted">Avg rating</div>
          </Card>
          <Card className="flex-1 p-4 text-center">
            <div className="text-3xl font-bold nums">{rows.length}</div>
            <div className="mt-1 text-xs text-muted">Total reviews</div>
          </Card>
          <Card className="flex-1 p-4 text-center">
            <div className="text-3xl font-bold nums">
              {rows.filter((r) => r.rating >= 4).length}
            </div>
            <div className="mt-1 text-xs text-muted">4-5 star</div>
          </Card>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-occupied">{error}</p>}
      {loading && <p className="mt-8 text-sm text-muted">Loading…</p>}

      {!loading && rows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterRating(0)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filterRating === 0 ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-text"}`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => setFilterRating(filterRating === n ? 0 : n)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${filterRating === n ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-text"}`}
            >
              {n} <Star size={12} className={filterRating === n ? "fill-current" : "fill-amber-400 text-amber-400"} />
            </button>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="mt-8 text-sm text-muted">No feedback yet.</p>
      )}

      {!loading && filtered.length === 0 && rows.length > 0 && (
        <p className="mt-8 text-sm text-muted">No {filterRating}-star feedback.</p>
      )}

      <div className="mt-6 space-y-3">
        {filtered.map((fb) => (
          <Card key={fb.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stars value={fb.rating} />
                <span className="text-sm font-medium">{fb.driverName ?? "Anonymous"}</span>
              </div>
              <span className="nums text-xs text-muted">
                #{fb.sessionId} · {fb.licensePlate}
              </span>
            </div>
            {fb.comment && (
              <p className="mt-2 text-sm text-muted">{fb.comment}</p>
            )}
            <div className="mt-2 text-xs text-muted">
              {new Date(fb.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
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
