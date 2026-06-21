import { useEffect, useState } from "react";
import { IdCard, Plus, QrCode } from "lucide-react";
import { Card, Button, Field, Input, Select, Spinner, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { driverApi, publicApi } from "../../lib/endpoints";

export default function PassesPage() {
  const [passes, setPasses] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [error, setError] = useState("");
  const PAST_PAGE_SIZE = 8;
  const [pastVisible, setPastVisible] = useState(PAST_PAGE_SIZE);

  const load = () => {
    setError("");
    Promise.all([driverApi.passes(), publicApi.pricing()])
      .then(([p, pricing]) => {
        setPasses(p);
        setVehicleTypes(pricing.map((v) => ({ id: v.vehicleTypeId, name: v.vehicleTypeName })));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error && passes === null) return <Alert>{error}</Alert>;
  if (passes === null) return <Spinner label="Loading passes" />;

  const active = passes.filter((p) => p.status === "ACTIVE");
  const past = passes.filter((p) => p.status !== "ACTIVE");

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Monthly passes</h1>
      <p className="mt-1 text-sm text-muted">
        An active pass means zero charge at check-out for the covered vehicle type.
      </p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <RegisterPassForm vehicleTypes={vehicleTypes} onDone={load} />

      {passes.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={IdCard} title="No passes yet" hint="Register your first monthly pass above." />
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-muted">Active</h2>
              <div className="space-y-3">
                {active.map((p) => <PassCard key={p.id} pass={p} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-muted">Past</h2>
              <div className="space-y-3">
                {past.slice(0, pastVisible).map((p) => <PassCard key={p.id} pass={p} />)}
              </div>
              {pastVisible < past.length && (
                <button
                  onClick={() => setPastVisible((c) => c + PAST_PAGE_SIZE)}
                  className="mt-3 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-elevated hover:text-primary"
                >
                  Show more ({past.length - pastVisible} remaining)
                </button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PassQr({ id }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    driverApi
      .passQr(id)
      .then((u) => { objectUrl = u; setUrl(u); })
      .catch(() => setFailed(true));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [id]);

  if (failed) return <div className="flex h-28 w-28 items-center justify-center rounded bg-elevated text-[11px] text-muted">QR unavailable</div>;
  if (!url) return <div className="h-28 w-28 animate-pulse rounded bg-elevated" />;
  return <img src={url} alt={`Pass QR ${id}`} className="block h-28 w-28" />;
}

function PassCard({ pass: p }) {
  const isActive = p.status === "ACTIVE";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {isActive ? (
          <div className="flex shrink-0 flex-col items-center">
            <PassQr id={p.id} />
            <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
              <QrCode size={11} /> Pass verification
            </span>
          </div>
        ) : (
          <IdCard size={18} className="shrink-0 text-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="nums font-semibold">{p.licensePlate}</span>
            <StatusBadge status={p.status} />
          </div>
          <div className="mt-0.5 text-sm text-muted">
            {p.vehicleTypeName} &middot; {p.validFrom} &mdash; {p.validUntil}
          </div>
        </div>
      </div>
    </Card>
  );
}

function RegisterPassForm({ vehicleTypes, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleTypeId: "", licensePlate: "", validFrom: "", validUntil: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      await driverApi.registerPass({
        vehicleTypeId: Number(form.vehicleTypeId),
        licensePlate: form.licensePlate.trim(),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
      });
      setForm({ vehicleTypeId: "", licensePlate: "", validFrom: "", validUntil: "" });
      setOpen(false);
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="secondary" className="mt-4">
        <Plus size={16} className="mr-1.5" /> Register new pass
      </Button>
    );
  }

  const canSubmit = form.vehicleTypeId && form.licensePlate.trim() && form.validFrom && form.validUntil;

  return (
    <Card className="mt-4 p-5">
      <h3 className="mb-4 text-sm font-semibold">Register new pass</h3>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle type">
          <Select value={form.vehicleTypeId} onChange={set("vehicleTypeId")} required>
            <option value="">Select type</option>
            {vehicleTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="License plate">
          <Input value={form.licensePlate} onChange={set("licensePlate")} placeholder="51A-12345" maxLength={20} required />
        </Field>
        <Field label="Valid from">
          <Input type="date" value={form.validFrom} onChange={set("validFrom")} required />
        </Field>
        <Field label="Valid until">
          <Input type="date" value={form.validUntil} onChange={set("validUntil")} required />
        </Field>
        {err && <p className="sm:col-span-2 text-sm text-occupied">{err}</p>}
        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit" loading={submitting} disabled={!canSubmit}>Register</Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
