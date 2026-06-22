import { useEffect, useState } from "react";
import { IdCard, Plus, X, Calendar } from "lucide-react";
import {
  Card,
  Button,
  Field,
  Input,
  Select,
  Skeleton,
  EmptyState,
  Alert,
  StatusBadge,
} from "../../components/ui";
import { managerApi } from "../../lib/endpoints";

const STATUS_FILTER = ["ALL", "PENDING", "ACTIVE", "EXPIRED"];

const fmtVnd = (v) => v != null ? Number(v).toLocaleString("vi-VN") + " ₫" : "—";

export default function MonthlyPassesPage() {
  const [passes, setPasses] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setError("");
    Promise.all([managerApi.passes(), managerApi.vehicleTypes()])
      .then(([p, vt]) => {
        setPasses(p);
        setVehicleTypes(vt);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const q = search.toLowerCase().trim();
  const filtered = passes
    ? passes
        .filter((p) => (filter !== "ALL" ? p.status === filter : true))
        .filter(
          (p) =>
            !q ||
            [p.licensePlate, p.userFullName, p.vehicleTypeName]
              .map((v) => (v ?? "").toLowerCase())
              .some((v) => v.includes(q))
        )
    : null;

  const revoke = async (id) => {
    setError("");
    try {
      await managerApi.revokePass(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activate = async (id) => {
    setError("");
    try {
      await managerApi.activatePass(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const countByStatus = (status) =>
    passes?.filter((p) => p.status === status).length || 0;

  const stats = [
    { label: "Total", count: passes?.length || 0 },
    { label: "Active", count: countByStatus("ACTIVE") },
    { label: "Pending", count: countByStatus("PENDING") },
    { label: "Expired", count: countByStatus("EXPIRED") },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Monthly passes</h1>
          <p className="mt-1 text-sm text-muted">
            Issue and manage recurring parking passes.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Issue pass</>}
        </Button>
      </div>

      {/* Filter tabs with counts */}

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <IssueForm
          vehicleTypes={vehicleTypes}
          onIssued={() => {
            setShowForm(false);
            load();
          }}
          onError={setError}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTER.map((s) => {
          const count = s === "ALL" ? (passes?.length ?? 0) : (passes ?? []).filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === s
                  ? "bg-accent text-accent-fg"
                  : "bg-elevated text-muted hover:text-text"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {filtered !== null && filtered.length > 0 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by license plate, driver name, or vehicle type..."
          className="mt-4"
        />
      )}

      {filtered === null ? (
        <div className="mt-4">
          <Skeleton rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={IdCard}
            title="No passes found"
            hint={filter !== "ALL" ? "Try a different filter." : "Issue one above to get started."}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {filtered.map((p) => (
            <PassCard key={p.id} pass={p} onRevoke={() => revoke(p.id)} onActivate={() => activate(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueForm({ vehicleTypes, onIssued, onError }) {
  const [form, setForm] = useState({
    email: "",
    vehicleTypeId: "",
    licensePlate: "",
    validFrom: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError("");
    try {
      const from = new Date(form.validFrom);
      const until = new Date(from);
      until.setMonth(until.getMonth() + 1);
      await managerApi.issuePass({
        email: form.email.trim(),
        vehicleTypeId: Number(form.vehicleTypeId),
        licensePlate: form.licensePlate.trim(),
        validFrom: form.validFrom,
        validUntil: until.toISOString().slice(0, 10),
      });
      onIssued();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Driver email">
          <Input type="email" required placeholder="driver@parkmaster.dev" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Vehicle type">
          <Select required value={form.vehicleTypeId} onChange={set("vehicleTypeId")}>
            <option value="">Select type...</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="License plate">
          <Input
            required
            maxLength={20}
            value={form.licensePlate}
            onChange={set("licensePlate")}
            placeholder="51F-123.45"
          />
        </Field>
        <Field label="Start date">
          <Input type="date" required value={form.validFrom} onChange={set("validFrom")} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            Issue pass
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PassCard({ pass, onRevoke, onActivate }) {
  const startDate = new Date(pass.validFrom);
  const endDate = new Date(pass.validUntil);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
  );

  const statusStyles = {
    ACTIVE: "border-l-4 border-l-available",
    PENDING: "border-l-4 border-l-reserved",
    EXPIRED: "border-l-4 border-l-line",
    REVOKED: "border-l-4 border-l-occupied",
  };

  return (
    <Card
      className={`p-4 transition ${
        statusStyles[pass.status] || statusStyles.EXPIRED
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="nums text-[15px] font-semibold">{pass.licensePlate}</span>
            <StatusBadge status={pass.status} />
            <span className="text-sm text-muted">{pass.userFullName}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>{pass.vehicleTypeName}</span>
            <span className="nums">{pass.validFrom} → {pass.validUntil}</span>
            <span className="nums font-medium">{pass.price != null ? fmtVnd(pass.price) : "—"}</span>
            {pass.status === "ACTIVE" && <span className="font-medium text-available">{daysRemaining}d left</span>}
            {pass.status === "PENDING" && <span className="font-medium text-reserved">Awaiting payment</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {pass.status === "PENDING" && (
            <Button variant="secondary" onClick={onActivate} size="sm">Activate</Button>
          )}
          {pass.status === "ACTIVE" && (
            <Button
              variant="secondary" onClick={onRevoke} size="sm"
              className="border-occupied/30 text-occupied hover:bg-occupied/10"
            >Revoke</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
