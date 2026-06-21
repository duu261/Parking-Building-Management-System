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

  const countByStatus = (status) =>
    passes?.filter((p) => p.status === status).length || 0;

  const stats = [
    {
      label: "Total",
      count: passes?.length || 0,
      color: "from-slate-50 to-slate-100",
      textColor: "text-slate-700",
    },
    {
      label: "Active",
      count: countByStatus("ACTIVE"),
      color: "from-green-50 to-green-100",
      textColor: "text-green-700",
    },
    {
      label: "Pending",
      count: countByStatus("PENDING"),
      color: "from-amber-50 to-amber-100",
      textColor: "text-amber-700",
    },
    {
      label: "Expired",
      count: countByStatus("EXPIRED"),
      color: "from-gray-50 to-gray-100",
      textColor: "text-gray-700",
    },
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

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-lg border border-gray-200 p-4`}
          >
            <p className="text-xs font-medium text-gray-600">{stat.label}</p>
            <p className={`mt-2 text-2xl font-bold ${stat.textColor}`}>
              {stat.count}
            </p>
          </div>
        ))}
      </div>

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

      <div className="mt-6 flex gap-1.5">
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

function IssueForm({ vehicleTypes, onIssued, onError }) {
  const [form, setForm] = useState({
    email: "",
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
        email: form.email.trim(),
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
  const startDate = new Date(pass.validFrom);
  const endDate = new Date(pass.validUntil);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
  );

  const statusStyles = {
    ACTIVE: "border-l-4 border-l-green-500 bg-green-50/40 hover:bg-green-50/60",
    PENDING: "border-l-4 border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/60",
    EXPIRED: "border-l-4 border-l-gray-400 bg-gray-50/40 hover:bg-gray-50/60",
    REVOKED: "border-l-4 border-l-red-400 bg-red-50/40 hover:bg-red-50/60",
  };

  return (
    <Card
      className={`flex flex-col gap-4 p-4 transition ${
        statusStyles[pass.status] || statusStyles.EXPIRED
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">
              {pass.licensePlate}
            </span>
            <StatusBadge status={pass.status} />
          </div>
          <p className="mt-1 font-medium text-gray-900">{pass.userFullName}</p>
          {pass.userEmail && (
            <p className="text-xs text-gray-600">{pass.userEmail}</p>
          )}
        </div>
        {pass.status !== "REVOKED" && (
          <Button
            variant="ghost"
            onClick={onRevoke}
            size="sm"
            className="shrink-0 text-occupied"
          >
            Revoke
          </Button>
        )}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="font-semibold uppercase text-gray-600">
              Vehicle Type
            </p>
            <p className="mt-1 text-gray-900">{pass.vehicleTypeName}</p>
          </div>
          <div>
            <p className="font-semibold uppercase text-gray-600">Valid Period</p>
            <p className="mt-1 text-gray-900">
              {pass.validFrom} → {pass.validUntil}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase text-gray-600">Price</p>
            <p className="mt-1 font-medium text-gray-900">
              {pass.price != null ? fmtVnd(pass.price) : "—"}
            </p>
          </div>
          {pass.status === "ACTIVE" && (
            <div>
              <p className="font-semibold uppercase text-gray-600">
                Days Left
              </p>
              <p className="mt-1 font-medium text-green-700">
                {daysRemaining} days
              </p>
            </div>
          )}
          {pass.status === "PENDING" && (
            <div>
              <p className="font-semibold uppercase text-gray-600">Status</p>
              <p className="mt-1 font-medium text-amber-700">
                Awaiting payment
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
