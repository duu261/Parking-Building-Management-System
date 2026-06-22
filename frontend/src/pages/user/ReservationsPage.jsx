import { useEffect, useState } from "react";
import { CalendarClock, MapPin, X, QrCode, Building2, Sparkles } from "lucide-react";
import { Card, Button, Field, Input, Select, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi, publicApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const EMPTY = { buildingId: "", vehicleTypeId: "", licensePlate: "" };

export default function ReservationsPage() {
  const [list, setList] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = () => {
    setError("");
    Promise.all([driverApi.reservations(), publicApi.buildings(), publicApi.pricing()])
      .then(([r, b, p]) => {
        setList(r);
        setBuildings(b);
        setTypes(p);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await driverApi.reserve({
        buildingId: Number(form.buildingId),
        vehicleTypeId: Number(form.vehicleTypeId),
        licensePlate: form.licensePlate.trim(),
      });
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    setError("");
    setCancelling(id);
    try {
      await driverApi.cancelReservation(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(null);
    }
  };

  if (error && list === null) return <Alert>{error}</Alert>;
  if (list === null) return <Spinner label="Loading reservations" />;

  const canSubmit = form.buildingId && form.vehicleTypeId && form.licensePlate.trim();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Reservations</h1>
      <p className="mt-1 text-sm text-muted">
        Reserve ahead — our AI picks the best available slot for you automatically.
        A pending hold is yours for 30 minutes.
      </p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Building">
            <Select value={form.buildingId} onChange={set("buildingId")} required>
              <option value="">Select building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Vehicle type">
            <Select value={form.vehicleTypeId} onChange={set("vehicleTypeId")} required>
              <option value="">Select type</option>
              {types.map((t) => (
                <option key={t.vehicleTypeId} value={t.vehicleTypeId}>{t.vehicleTypeName}</option>
              ))}
            </Select>
          </Field>
          <Field label="License plate">
            <Input value={form.licensePlate} onChange={set("licensePlate")} placeholder="51A-12345" maxLength={20} required />
          </Field>
          <div className="flex items-end">
            <Button type="submit" loading={submitting} disabled={!canSubmit} className="w-full sm:w-auto">
              Reserve a slot
            </Button>
          </div>
        </form>
      </Card>

      <AvailabilityBar buildings={buildings} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={CalendarClock} title="No reservations yet" hint="Reserve a slot above and it will appear here." />
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {list.slice(0, visibleCount).map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-4">
                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <ReservationQr id={r.id} />
                      <span className="nums text-xs font-medium text-muted">ID: {r.id}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="nums font-semibold">{r.licensePlate}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {r.buildingName ? `${r.buildingName} › ${r.floorName} › ` : ""}<span className="nums text-text">{r.slotCode}</span>
                      </span>
                      {r.status === "PENDING" && <span className="nums">held until {time(r.holdUntil)}</span>}
                    </div>
                    {r.allocationScore ? (
                      <ScoreBreakdownCard score={r.allocationScore} compact />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <Sparkles size={10} /> AI-assigned
                      </span>
                    )}
                    {r.status === "PENDING" && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <QrCode size={12} /> Show QR to staff for check-in
                      </div>
                    )}
                  </div>
                  {r.status === "PENDING" && (
                    <Button variant="secondary" onClick={() => cancel(r.id)} loading={cancelling === r.id}>
                      <X size={16} /> Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {visibleCount < list.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-elevated hover:text-primary"
            >
              Show more ({list.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AvailabilityBar({ buildings }) {
  if (buildings.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
        <Building2 size={16} className="text-muted" /> Slot availability
      </h2>
      <div className="space-y-2">
        {buildings.map((b) => {
          const total = b.totalSlots ?? 0;
          const open = b.availableSlots ?? 0;
          const pct = total > 0 ? Math.round((open / total) * 100) : 0;
          return (
            <div key={b.id} className="rounded-[var(--radius)] border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.name}</span>
                <span className="nums text-xs text-muted">{open}/{total} open</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 50 ? "var(--available)" : pct > 20 ? "var(--reserved)" : "var(--occupied)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReservationQr({ id }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let objectUrl;
    driverApi.reservationQr(id).then((u) => { objectUrl = u; setUrl(u); }).catch(() => {});
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [id]);
  if (!url) return <div className="h-40 w-40 animate-pulse rounded bg-elevated shrink-0" />;
  return (
    <img src={url} alt="Reservation QR" className="block h-40 w-40 shrink-0" />
  );
}
