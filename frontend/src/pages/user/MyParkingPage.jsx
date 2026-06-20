import { useEffect, useState } from "react";
import { QrCode, Car, MapPin, Building2, IdCard } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi, publicApi } from "../../lib/endpoints";

function TicketQr({ id }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    driverApi
      .ticketBlob(id)
      .then((u) => {
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => setFailed(true));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [id]);

  if (failed) {
    return <div className="w-40 aspect-square flex items-center justify-center rounded bg-elevated text-[11px] text-muted">QR unavailable</div>;
  }
  if (!url) return <div className="w-40 aspect-square animate-pulse rounded bg-elevated" />;
  return (
    <img src={url} alt={`Ticket QR for session ${id}`} className="block w-40 aspect-square" />
  );
}

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MyParkingPage() {
  const [sessions, setSessions] = useState(null);
  const [payments, setPayments] = useState([]);
  const [passes, setPasses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(null);

  const load = () => {
    setError("");
    Promise.all([driverApi.sessions(), driverApi.payments()])
      .then(([s, p]) => {
        setSessions(s);
        setPayments(p);
      })
      .catch((e) => setError(e.message));

    driverApi.passes().then(setPasses).catch(() => {});

    publicApi.buildings().then(async (list) => {
      const enriched = await Promise.all(
        list.map(async (b) => {
          try { return { ...b, ...(await publicApi.availability(b.id)) }; }
          catch { return b; }
        }),
      );
      setBuildings(enriched);
    }).catch(() => {});
  };

  useEffect(load, []);

  const pay = async (paymentId) => {
    setError("");
    setPaying(paymentId);
    try {
      await driverApi.pay(paymentId);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(null);
    }
  };

  if (error && sessions === null) return <Alert>{error}</Alert>;
  if (sessions === null) return <Spinner label="Loading your parking" />;

  const active = sessions.filter((s) => s.status === "ACTIVE");
  const pendingBySession = Object.fromEntries(
    payments.filter((p) => p.status === "PENDING").map((p) => [p.sessionId, p]),
  );

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">My parking</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {/* Active session — hero */}
      {active.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Car} title="Not parked right now" hint="Active sessions show here with your ticket QR." />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {active.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex shrink-0 flex-col items-center">
                  <TicketQr id={s.id} />
                  <span className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                    <QrCode size={12} /> Scan to check out
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="nums text-lg font-semibold">{s.licensePlate}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> slot <span className="nums text-text">{s.slotId}</span>
                    </span>
                    <span className="nums">in {time(s.checkInAt)}</span>
                  </div>
                  {pendingBySession[s.id] && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-elevated px-4 py-3">
                      <div className="text-sm">
                        Amount due{" "}
                        <span className="nums font-semibold">{money(pendingBySession[s.id].amount)}</span>
                      </div>
                      <Button onClick={() => pay(pendingBySession[s.id].id)} loading={paying === pendingBySession[s.id].id}>
                        Pay online
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom grid: passes + availability side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Monthly passes */}
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
            <IdCard size={16} className="text-muted" /> Monthly passes
          </h2>
          {passes.length === 0 ? (
            <p className="text-sm text-muted">No active passes.</p>
          ) : (
            <div className="space-y-2">
              {passes.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-[var(--radius)] border border-line bg-surface p-4">
                  <div>
                    <span className="text-sm font-medium">{p.vehicleTypeName}</span>
                    <span className="ml-2 nums text-xs text-muted">{p.licensePlate}</span>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.status} />
                    <div className="mt-0.5 nums text-[11px] text-muted">{p.validFrom} — {p.validUntil}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Building availability */}
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
            <Building2 size={16} className="text-muted" /> Slot availability
          </h2>
          {buildings.length === 0 ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
}
