import { useEffect, useState } from "react";
import { IdCard, Plus, X } from "lucide-react";
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
import { managerApi, adminApi } from "../../lib/endpoints";

const STATUS_FILTER = ["ALL", "ACTIVE", "EXPIRED"];

export default function MonthlyPassesPage() {
  const [passes, setPasses] = useState(null);
  const [users, setUsers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setError("");
    Promise.all([managerApi.passes(), adminApi.users(), managerApi.vehicleTypes()])
      .then(([p, u, vt]) => {
        setPasses(p);
        setUsers(u);
        setVehicleTypes(vt);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const filtered =
    passes && filter !== "ALL" ? passes.filter((p) => p.status === filter) : passes;

  const revoke = async (id) => {
    setError("");
    try {
      await managerApi.revokePass(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
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

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <IssueForm
          users={users}
          vehicleTypes={vehicleTypes}
          onIssued={() => {
            setShowForm(false);
            load();
          }}
          onError={setError}
        />
      )}

      <div className="mt-5 flex gap-1.5">
        {STATUS_FILTER.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === s
                ? "border-text bg-text text-bg"
                : "border-line text-muted hover:border-text/30 hover:text-text"
            }`}
          >
            {s === "ALL" ? `All${passes ? ` (${passes.length})` : ""}` : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

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
            <PassCard key={p.id} pass={p} onRevoke={() => revoke(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueForm({ users, vehicleTypes, onIssued, onError }) {
  const [form, setForm] = useState({
    userId: "",
    vehicleTypeId: "",
    licensePlate: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError("");
    try {
      await managerApi.issuePass({
        userId: Number(form.userId),
        vehicleTypeId: Number(form.vehicleTypeId),
        licensePlate: form.licensePlate.trim(),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
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
        <Field label="Driver">
          <Select required value={form.userId} onChange={set("userId")}>
            <option value="">Select driver...</option>
            {users
              .filter((u) => u.role === "USER")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
          </Select>
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
        <Field label="Valid from">
          <Input type="date" required value={form.validFrom} onChange={set("validFrom")} />
        </Field>
        <Field label="Valid until">
          <Input
            type="date"
            required
            min={form.validFrom}
            value={form.validUntil}
            onChange={set("validUntil")}
          />
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

function PassCard({ pass, onRevoke }) {
  const isActive = pass.status === "ACTIVE";
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold tracking-tight">{pass.licensePlate}</span>
          <StatusBadge status={pass.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted">
          <span>{pass.userFullName}</span>
          <span>{pass.vehicleTypeName}</span>
          <span>
            {pass.validFrom} &rarr; {pass.validUntil}
          </span>
        </div>
      </div>
      {isActive && (
        <Button variant="ghost" onClick={onRevoke} className="shrink-0 text-occupied">
          Revoke
        </Button>
      )}
    </Card>
  );
}
