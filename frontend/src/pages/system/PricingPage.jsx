import { useEffect, useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { Card, Button, Field, Input, Skeleton, EmptyState, Alert } from "../../components/ui";
import { managerApi } from "../../lib/endpoints";

// Defaults mirror PricingPolicyRequest validation (rate >= 0, peakMultiplier >= 1.0).
const EMPTY_POLICY = { ratePerHour: "", dailyCap: "", graceMinutes: "", peakMultiplier: "" };

export default function PricingPage() {
  const [types, setTypes] = useState(null);
  const [policies, setPolicies] = useState({});
  const [error, setError] = useState("");
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setError("");
    Promise.all([managerApi.vehicleTypes(), managerApi.pricing()])
      .then(([vt, pol]) => {
        setTypes(vt);
        setPolicies(Object.fromEntries(pol.map((p) => [p.vehicleTypeId, p])));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const addType = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await managerApi.createVehicleType({ name: newType.name, description: newType.description });
      setNewType({ name: "", description: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeType = async (id) => {
    setError("");
    try {
      await managerApi.deleteVehicleType(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Vehicle types &amp; pricing</h1>
      <p className="mt-1 text-sm text-muted">One pricing policy per vehicle type.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 p-5">
        <form onSubmit={addType} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Name">
            <Input
              required
              maxLength={60}
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              placeholder="Car, Motorbike..."
            />
          </Field>
          <Field label="Description">
            <Input
              maxLength={255}
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Button type="submit" loading={creating}>
            <Plus size={16} /> Add type
          </Button>
        </form>
      </Card>

      {types === null ? (
        <div className="mt-6">
          <Skeleton rows={3} />
        </div>
      ) : types.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Tag} title="No vehicle types" hint="Add one above to set pricing." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {types.map((t) => (
            <TypeCard
              key={t.id}
              type={t}
              policy={policies[t.id]}
              onRemove={() => removeType(t.id)}
              onSaved={load}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeCard({ type, policy, onRemove, onSaved, onError }) {
  const [form, setForm] = useState(() =>
    policy
      ? {
          ratePerHour: policy.ratePerHour,
          dailyCap: policy.dailyCap ?? "",
          graceMinutes: policy.graceMinutes,
          peakMultiplier: policy.peakMultiplier,
        }
      : EMPTY_POLICY,
  );
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError("");
    try {
      await managerApi.setPricing(type.id, {
        ratePerHour: Number(form.ratePerHour),
        dailyCap: form.dailyCap === "" ? null : Number(form.dailyCap),
        graceMinutes: Number(form.graceMinutes || 0),
        peakMultiplier: Number(form.peakMultiplier),
      });
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-tight">{type.name}</h2>
          {type.description && <p className="mt-0.5 text-sm text-muted">{type.description}</p>}
        </div>
        <Button variant="ghost" onClick={onRemove} aria-label="Delete type">
          <Trash2 size={16} />
        </Button>
      </div>

      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-4">
        <Field label="Rate / hour">
          <Input type="number" min="0" step="0.01" required value={form.ratePerHour} onChange={set("ratePerHour")} />
        </Field>
        <Field label="Daily cap">
          <Input type="number" min="0" step="0.01" value={form.dailyCap} onChange={set("dailyCap")} placeholder="None" />
        </Field>
        <Field label="Grace (min)">
          <Input type="number" min="0" value={form.graceMinutes} onChange={set("graceMinutes")} />
        </Field>
        <Field label="Peak x">
          <Input type="number" min="1" step="0.1" required value={form.peakMultiplier} onChange={set("peakMultiplier")} />
        </Field>
        <div className="sm:col-span-4">
          <Button type="submit" variant="secondary" loading={saving}>
            {policy ? "Update pricing" : "Set pricing"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
