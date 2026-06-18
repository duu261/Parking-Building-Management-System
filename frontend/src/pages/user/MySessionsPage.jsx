import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Card, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MySessionsPage() {
  const [sessions, setSessions] = useState(null);
  const [payBySession, setPayBySession] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([driverApi.sessions(), driverApi.payments()])
      .then(([s, p]) => {
        setSessions(s);
        setPayBySession(Object.fromEntries(p.map((x) => [x.sessionId, x])));
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (sessions === null) return <Spinner label="Loading sessions" />;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">My sessions</h1>
      <p className="mt-1 text-sm text-muted">Every check-in and what you paid.</p>

      {sessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={History} title="No sessions yet" hint="Your parking history will appear here." />
        </div>
      ) : (
        <Card className="mt-6 divide-y divide-line">
          {sessions.map((s) => {
            const pay = payBySession[s.id];
            return (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="nums text-[15px] font-semibold">{s.licensePlate}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span className="nums">{time(s.checkInAt)}</span>
                    <span className="text-line">|</span>
                    <span className="nums">{s.checkOutAt ? time(s.checkOutAt) : "parked"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="nums text-sm font-semibold">{money(s.amountCharged)}</div>
                  {pay && (
                    <div className="text-[11px] text-muted">
                      {pay.status === "PAID" ? "paid" : pay.status.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
