import { useEffect, useState } from "react";
import { Car, RefreshCw, Building2 } from "lucide-react";
import { Card, Button, Skeleton, EmptyState, Alert, StatusBadge, Input } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";
import SlotMap from "../../components/SlotMap";

function formatTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState(null);
  const [types, setTypes] = useState({});
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setError("");
    Promise.all([staffApi.active(), staffApi.vehicleTypes()])
      .then(([active, vt]) => {
        setSessions(active);
        setTypes(Object.fromEntries(vt.map((t) => [t.id, t.name])));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const checkOut = async (id) => {
    setError("");
    setCheckingOut(id);
    try {
      await staffApi.checkOut(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(null);
    }
  };

  const q = search.toLowerCase().trim();
  const filtered = sessions
    ? sessions.filter(
        (s) =>
          !q ||
          [s.licensePlate, s.buildingName, s.floorName, s.slotCode]
            .map((v) => (v ?? "").toLowerCase())
            .some((v) => v.includes(q))
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Active sessions</h1>
          {sessions !== null && (
            <span className="nums rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              {sessions.length}
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted">Vehicles currently parked.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {sessions !== null && sessions.length > 0 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by license plate, building, floor, or slot..."
          className="mt-4"
        />
      )}

      {sessions === null ? (
        <div className="mt-6">
          <Skeleton rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Car} title={sessions.length === 0 ? "No active sessions" : "No matches"} hint={sessions.length === 0 ? "Checked-in vehicles will appear here." : "Try a different search."} />
        </div>
      ) : (
        <Card className="mt-6 divide-y divide-line">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="nums text-xs text-muted">#{s.id}</span>
                  <span className="nums text-sm font-semibold">{s.licensePlate}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>{types[s.vehicleTypeId] ?? `Type ${s.vehicleTypeId}`}</span>
                  <span className="text-line">|</span>
                  <span>
                    {s.buildingName ? `${s.buildingName} › ${s.floorName} › ` : "slot "}<span className="nums text-text">{s.slotCode ?? s.slotId}</span>
                  </span>
                  <span className="text-line">|</span>
                  <span className="nums">{formatTime(s.checkInAt)}</span>
                </div>
              </div>
              <Button onClick={() => checkOut(s.id)} loading={checkingOut === s.id}>
                Check out
              </Button>
            </div>
          ))}
        </Card>
      )}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Building2 size={16} className="text-muted" /> Slot map
        </h2>
        <SlotMap />
      </section>
    </div>
  );
}
