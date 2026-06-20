import { useEffect, useState } from "react";
import { History, ChevronDown } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function MySessionsPage() {
  const [sessions, setSessions] = useState(null);
  const [payBySession, setPayBySession] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([driverApi.sessions(), driverApi.payments()])
      .then(([s, p]) => {
        setSessions(s);
        setPayBySession(Object.fromEntries(p.map((x) => [x.sessionId, x])));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

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
            const open = expanded === s.id;
            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-elevated"
                >
                  <ChevronDown
                    size={15}
                    className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
                  />
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
                        {pay.status === "PAID" ? "paid" : (pay.status ?? "").toLowerCase()}
                      </div>
                    )}
                  </div>
                </button>
                {open && <SessionDetail session={s} payment={pay} onPaid={load} />}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function SessionDetail({ session: s, payment: pay, onPaid }) {
  return (
    <div className="border-t border-line bg-elevated/50 px-5 py-4 text-sm">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        <Info label="Session ID" value={`#${s.id}`} />
        <Info label="License plate" value={s.licensePlate} />
        <Info label="Vehicle type" value={s.vehicleTypeName ?? "-"} />
        <Info label="Building" value={s.buildingName ?? "-"} />
        <Info label="Slot" value={s.slotId ?? "-"} />
        <Info label="Allocation" value={s.autoAllocated ? "Auto" : "Manual"} />
        <Info label="Checked in" value={time(s.checkInAt)} />
        <Info label="Checked out" value={s.checkOutAt ? time(s.checkOutAt) : "Still parked"} />
        <Info label="Charge" value={money(s.amountCharged)} />
        {pay && (
          <>
            <Info label="Payment status" value={pay.status} />
            <Info label="Payment method" value={pay.method ?? "-"} />
            <Info label="Paid at" value={pay.paidAt ? time(pay.paidAt) : "-"} />
          </>
        )}
      </div>
      {pay?.status === "PENDING" && (
        <PayButton paymentId={pay.id} onDone={onPaid} />
      )}
    </div>
  );
}

function PayButton({ paymentId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setErr("");
    try {
      await driverApi.pay(paymentId);
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {err && <p className="mb-2 text-sm text-occupied">{err}</p>}
      <Button onClick={handlePay} loading={loading}>Pay now</Button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="nums mt-0.5 font-medium">{value}</div>
    </div>
  );
}
