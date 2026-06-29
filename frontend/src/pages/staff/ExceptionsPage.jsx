import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Card, Button, Field, Input, Select, Textarea, Spinner, EmptyState, Alert } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";

const TYPES = ["LOST_TICKET", "WRONG_PLATE", "OVERTIME", "WRONG_ZONE"];
const label = (t) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const TYPE_COLOR = {
  LOST_TICKET: { border: "border-l-amber-500", text: "text-amber-500" },
  WRONG_PLATE: { border: "border-l-rose-500", text: "text-rose-500" },
  OVERTIME: { border: "border-l-violet-500", text: "text-violet-500" },
  WRONG_ZONE: { border: "border-l-sky-500", text: "text-sky-500" },
};
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight">Exceptions</h1>
      <p className="mt-1 text-sm text-muted">Log floor incidents. Manager reviews and resolves.</p>


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
            <Input value={form.sessionId} onChange={set("sessionId")} placeholder="Session ID" inputMode="numeric" />
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
            <ExceptionCard key={x.id} report={x} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExceptionCard({ report }) {
  const c = TYPE_COLOR[report.type] ?? TYPE_COLOR.LOST_TICKET;
  return (
    <Card className={`p-4 border-l-4 ${c.border}`}>
      <div className="flex items-center gap-2.5">
        <TriangleAlert size={15} className={c.text} />
        <span className={`text-sm font-semibold uppercase tracking-wide ${c.text}`}>{label(report.type)}</span>
        {report.sessionId && <span className="nums text-xs text-muted">#{report.sessionId}</span>}
        <span className="nums ml-auto text-xs text-muted">{time(report.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm text-text">{report.description}</p>
      <p className="mt-1 text-xs text-muted">reported by {report.reportedBy}</p>
      <p className="mt-1 text-xs text-muted italic">Pending manager review</p>
    </Card>
  );
}
