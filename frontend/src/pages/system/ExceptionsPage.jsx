import { useEffect, useState } from "react";
import { TriangleAlert, Check } from "lucide-react";
import { Card, Button, Input, Spinner, EmptyState, Alert } from "../../components/ui";
import { managerApi } from "../../lib/endpoints";

const label = (t) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const TYPE_COLOR = {
  LOST_TICKET: { border: "border-l-amber-500", text: "text-amber-500" },
  WRONG_PLATE: { border: "border-l-rose-500", text: "text-rose-500" },
  OVERTIME: { border: "border-l-violet-500", text: "text-violet-500" },
  WRONG_ZONE: { border: "border-l-sky-500", text: "text-sky-500" },
};
const time = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

export default function ExceptionsPage() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("open");
  const [filterType, setFilterType] = useState("");

  const load = () => {
    setError("");
    managerApi.exceptions()
      .then(setList)
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error && list === null) return <Alert>{error}</Alert>;
  if (list === null) return <Spinner label="Loading exceptions" />;

  const open = list.filter((r) => r.status === "OPEN");
  const resolved = list.filter((r) => r.status === "RESOLVED");
  const tabList = tab === "open" ? open : resolved;

  const shown = filterType ? tabList.filter((r) => r.type === filterType) : tabList;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Exception reports</h1>
      <p className="mt-1 text-sm text-muted">Review and resolve staff-reported incidents.</p>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-4 flex gap-2">
        <TabBtn active={tab === "open"} onClick={() => setTab("open")}>
          Open ({open.length})
        </TabBtn>
        <TabBtn active={tab === "resolved"} onClick={() => setTab("resolved")}>
          Resolved ({resolved.length})
        </TabBtn>
      </div>

      {tabList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <TypeBtn active={!filterType} onClick={() => setFilterType("")}>All</TypeBtn>
          {["LOST_TICKET", "WRONG_PLATE", "OVERTIME", "WRONG_ZONE"].map((t) => (
            <TypeBtn key={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? "" : t)}>
              {label(t)}
            </TypeBtn>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={TriangleAlert} title={`No ${tab} exceptions`} hint="Nothing here." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((r) => (
            <ExceptionCard key={r.id} report={r} onDone={load} onError={setError} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function TypeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        active ? "bg-text text-surface" : "bg-elevated text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function ExceptionCard({ report, onDone, onError }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    onError("");
    setBusy(true);
    try {
      await managerApi.resolveException(report.id, note.trim());
      onDone();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

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

      {report.status === "OPEN" ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note" maxLength={1000} className="flex-1" />
          <Button variant="secondary" onClick={resolve} loading={busy} disabled={!note.trim()}>
            <Check size={16} /> Resolve
          </Button>
        </div>
      ) : (
        <div className="mt-2 rounded-md bg-elevated px-3 py-2 text-xs text-muted">
          <span className="font-medium text-text">Resolved:</span> {report.resolutionNote}
          <span className="ml-2 nums">{time(report.resolvedAt)}</span>
        </div>
      )}
    </Card>
  );
}
