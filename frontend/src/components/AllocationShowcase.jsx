import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";
import { publicApi } from "../lib/endpoints";

// The grading feature, made visible to anyone (no login): pick a building + vehicle
// type and watch the allocator score every open slot live, best-first, with the
// per-criterion breakdown that answers RQ2-RQ4. Weights sum to 100, so the total
// reads as a confidence score out of 100.
const CRITERIA = [
  { key: "vehicleTypeMatch", label: "Vehicle-type match", max: 40, reason: "it is the right floor for this vehicle" },
  { key: "loadBalance", label: "Load balance", max: 30, reason: "it spreads cars evenly across floors" },
  { key: "distanceToEntry", label: "Distance to entry", max: 20, reason: "it sits closest to the entrance" },
  { key: "peakHour", label: "Peak-hour boost", max: 10, reason: "it eases the peak-hour crush" },
];

const SELECT_CLASS =
  "appearance-none rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-text/40";

// The criterion the winner scored highest on, as a fraction of its own weight.
function topReason(slot) {
  return CRITERIA.reduce((best, c) =>
    slot[c.key] / c.max > slot[best.key] / best.max ? c : best,
  );
}

export default function AllocationShowcase() {
  const [buildings, setBuildings] = useState([]);
  const [types, setTypes] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [ranked, setRanked] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([publicApi.buildings(), publicApi.pricing()])
      .then(([b, p]) => {
        setBuildings(b);
        setTypes(p);
        if (b[0]) setBuildingId(String(b[0].id));
        if (p[0]) setVehicleTypeId(String(p[0].vehicleTypeId));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!buildingId || !vehicleTypeId) return;
    setError("");
    setRanked(null);
    publicApi
      .allocationPreview(buildingId, vehicleTypeId, 6)
      .then(setRanked)
      .catch((e) => setError(e.message));
  }, [buildingId, vehicleTypeId]);

  // Hide rather than render an empty shell on a fresh database.
  if (error || (buildings.length === 0 && ranked === null)) return null;

  const winner = ranked && ranked[0];
  const rest = ranked ? ranked.slice(1) : [];
  const typeName = types.find((t) => String(t.vehicleTypeId) === String(vehicleTypeId))?.vehicleTypeName;

  return (
    <div>
      <div className="flex items-center gap-2 text-accent">
        <Sparkles size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">Live AI slot allocation</span>
      </div>
      <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight md:text-4xl">
        Where should this car park? The AI answers in milliseconds.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Switch the vehicle type and watch every open slot get re-scored on four weighted
        criteria, best first. This is the live engine, no login.
      </p>

      <div className="mt-7 grid gap-3 sm:max-w-md sm:grid-cols-2">
        <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={SELECT_CLASS}>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)} className={SELECT_CLASS}>
          {types.map((t) => (
            <option key={t.vehicleTypeId} value={t.vehicleTypeId}>{t.vehicleTypeName}</option>
          ))}
        </select>
      </div>

      {ranked && ranked.length === 0 && (
        <p className="mt-6 text-sm text-muted">This building is full. No slot to allocate right now.</p>
      )}

      {winner && (
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div
            className="rounded-[var(--radius)] border-2 bg-surface p-6 shadow-[var(--shadow-pop)]"
            style={{ borderColor: "var(--accent)" }}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-accent">
              <Trophy size={12} /> AI pick{typeName ? ` for ${typeName}` : ""}
            </span>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <div className="nums text-4xl font-semibold tracking-tight">{winner.slotCode}</div>
                <div className="mt-1 text-sm text-muted">{winner.floorName} · level {winner.level}</div>
              </div>
              <div className="text-right">
                <div className="nums text-4xl font-semibold tracking-tight text-accent">{winner.total}</div>
                <div className="text-xs uppercase tracking-wide text-muted">score / 100</div>
              </div>
            </div>

            <p className="mt-4 border-t border-line pt-4 text-sm text-text">
              Won because {topReason(winner).reason}.
            </p>

            <div className="mt-4 space-y-3">
              {CRITERIA.map(({ key, label, max }) => (
                <div key={key}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted">{label}</span>
                    <span className="nums text-text">{winner[key]} / {max}</span>
                  </div>
                  <div className="mt-1.5 h-px w-full bg-line">
                    <div
                      className="h-px"
                      style={{
                        width: `${Math.min(100, (winner[key] / max) * 100)}%`,
                        backgroundColor: "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {rest.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-wide text-muted">Runners-up</p>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {rest.map((c, i) => (
                    <li key={c.slotId} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="nums w-5 text-muted">{i + 2}</span>
                      <span className="nums font-medium">{c.slotCode}</span>
                      <span className="text-xs text-muted">{c.floorName}</span>
                      <span className="nums ml-auto text-muted">{c.total}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg shadow-[var(--shadow-card)] transition hover:opacity-90 active:translate-y-px"
            >
              Let it park you <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
