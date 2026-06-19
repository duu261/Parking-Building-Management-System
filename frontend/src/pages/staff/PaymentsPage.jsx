import { useEffect, useState } from "react";
import { Banknote, Ban, Check } from "lucide-react";
import { Card, Button, Input, Spinner, EmptyState, Alert } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function PaymentsPage() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    staffApi.pendingPayments().then(setList).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error && list === null) return <Alert>{error}</Alert>;
  if (list === null) return <Spinner label="Loading payments" />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-muted">Pending charges. Settle cash at the booth or void with a reason.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Banknote} title="Nothing pending" hint="Unpaid charges awaiting settlement show here." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((p) => (
            <PaymentCard key={p.id} payment={p} onDone={load} onError={setError} />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentCard({ payment, onDone, onError }) {
  const [reason, setReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [settling, setSettling] = useState(false);

  const settle = async () => {
    onError("");
    setSettling(true);
    try {
      await staffApi.settlePayment(payment.id, "CASH");
      onDone();
    } catch (e) {
      onError(e.message);
    } finally {
      setSettling(false);
    }
  };

  const voidIt = async () => {
    onError("");
    setVoiding(true);
    try {
      await staffApi.voidPayment(payment.id, reason.trim());
      onDone();
    } catch (e) {
      onError(e.message);
    } finally {
      setVoiding(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="nums text-lg font-semibold">{money(payment.amount)}</span>
        <span className="nums text-xs text-muted">session {payment.sessionId}</span>
        <span className="nums ml-auto text-xs text-muted">{time(payment.createdAt)}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={settle} loading={settling}>
          <Check size={16} /> Settle cash
        </Button>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Void reason"
          maxLength={255}
          className="flex-1"
        />
        <Button variant="secondary" onClick={voidIt} loading={voiding} disabled={!reason.trim()}>
          <Ban size={16} /> Void
        </Button>
      </div>
    </Card>
  );
}
