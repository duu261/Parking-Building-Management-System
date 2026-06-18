import { useEffect, useState } from "react";
import { TriangleAlert, Check } from "lucide-react";
import { Card, Button, Field, Input, Select, Textarea, Spinner, EmptyState, Alert } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";

const TYPES = ["LOST_TICKET", "WRONG_PLATE", "OVERTIME", "WRONG_ZONE"];
const label = (t) => t.replace("_", " ").toLowerCase();
const time = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const EMPTY = { type: "LOST_TICKET", description: "", sessionId: "" };

export default function ExceptionsPage() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setError("");
    staffApi.exceptions().then(setList).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await staffApi.reportException({
        type: form.type,
        description: form.description.trim(),
        sessionId: form.sessionId ? Number(form.sessionId) : null,
      });
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && list === null) return <Alert>{error}</Alert>;
  if (list === null) return <Spinner label="Loading exceptions" />;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Exceptions</h1>
      <p className="mt-1 text-sm text-muted">Log floor incidents and resolve open reports.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={form.type} onChange={set("type")}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{label(t)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Session ID (optional)">
            <Input value={form.sessionId} onChange={set("sessionId")} placeholder="e.g. 42" inputMode="numeric" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea value={form.description} onChange={set("description")} rows={3} maxLength={1000} required placeholder="What happened" />
            </Field>
          </div>
          <div>
            <Button type="submit" loading={submitting} disabled={!form.description.trim()}>
              Log exception
            </Button>
          </div>
        </form>
      </Card>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={TriangleAlert} title="No open exceptions" hint="Logged incidents awaiting resolution show here." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((x) => (
            <ExceptionCard key={x.id} report={x} onResolved={load} onError={setError} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExceptionCard({ report, onResolved, onError }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    onError("");
    setBusy(true);
    try {
      await staffApi.resolveException(report.id, note.trim());
      onResolved();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <TriangleAlert size={15} className="text-maintenance" />
        <span className="text-sm font-semibold uppercase tracking-wide">{label(report.type)}</span>
        {report.sessionId && <span className="nums text-xs text-muted">session {report.sessionId}</span>}
        <span className="nums ml-auto text-xs text-muted">{time(report.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm text-text">{report.description}</p>
      <p className="mt-1 text-xs text-muted">reported by {report.reportedBy}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note" maxLength={1000} className="flex-1" />
        <Button variant="secondary" onClick={resolve} loading={busy} disabled={!note.trim()}>
          <Check size={16} /> Resolve
        </Button>
      </div>
    </Card>
  );
}
