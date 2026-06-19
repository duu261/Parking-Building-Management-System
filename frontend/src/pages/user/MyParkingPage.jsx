import { useEffect, useState } from "react";
import { QrCode, Car, MapPin } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";

// The ticket PNG is auth-gated, so fetch it with the token and show it from an
// object URL (a bare <img src> would 401). Falls back to a skeleton then an error note.
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

  const box = "size-36 rounded-[var(--radius)] border border-line";
  if (failed) {
    return <div className={`${box} flex items-center justify-center bg-elevated text-[11px] text-muted`}>QR unavailable</div>;
  }
  if (!url) return <div className={`${box} animate-pulse bg-elevated`} />;
  return <img src={url} alt={`Ticket QR for session ${id}`} className={`${box} bg-white p-2`} />;
}

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MyParkingPage() {
  const [sessions, setSessions] = useState(null);
  const [payments, setPayments] = useState([]);
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
      <p className="mt-1 text-sm text-muted">Your live sessions and ticket.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

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
    </div>
  );
}
