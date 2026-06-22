import { useEffect, useState } from "react";
import { Building2, Plus, Trash2, ChevronRight, Pencil, Check, X } from "lucide-react";
import { Card, Button, Field, Input, Select, Skeleton, EmptyState, Alert, StatusBadge } from "../../components/ui";
import { managerApi, publicApi } from "../../lib/endpoints";

const SLOT_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "LOCKED"];

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState(null);
  const [types, setTypes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "" });
  const [creating, setCreating] = useState(false);

  const [avail, setAvail] = useState({});

  const load = () => {
    setError("");
    Promise.all([managerApi.buildings(), managerApi.vehicleTypes()])
      .then(async ([b, vt]) => {
        setBuildings(b);
        setTypes(vt);
        const avails = await Promise.all(b.map((x) => publicApi.availability(x.id).catch(() => ({}))));
        setAvail(Object.fromEntries(b.map((x, i) => [x.id, avails[i]])));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await managerApi.createBuilding(form);
      setForm({ name: "", address: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await managerApi.deleteBuilding(id);
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async (id, data) => {
    setError("");
    try {
      await managerApi.updateBuilding(id, data);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">Buildings</h1>
      <p className="mt-1 text-sm text-muted">Buildings, floors, and slots. Segment floors by vehicle type.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Name">
            <Input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input maxLength={255} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" />
          </Field>
          <Button type="submit" loading={creating}>
            <Plus size={16} /> Add building
          </Button>
        </form>
      </Card>

      {buildings === null ? (
        <div className="mt-6">
          <Skeleton rows={3} />
        </div>
      ) : buildings.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Building2} title="No buildings" hint="Add one above to start." />
        </div>
      ) : (
        <Card className="mt-6 divide-y divide-line">
          {buildings.map((b) =>
            editing?.id === b.id ? (
              <EditRow key={b.id} building={b} onSave={(d) => saveEdit(b.id, d)} onCancel={() => setEditing(null)} />
            ) : (
              <button
                key={b.id}
                onClick={() => setSelected(selected?.id === b.id ? null : b)}
                className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-elevated ${
                  selected?.id === b.id ? "bg-elevated" : ""
                }`}
              >
                <ChevronRight size={16} className={`text-muted transition ${selected?.id === b.id ? "rotate-90" : ""}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{b.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                    {b.address && <span>{b.address}</span>}
                    {avail[b.id] && (
                      <span className="nums font-medium">
                        {avail[b.id].availableSlots}/{avail[b.id].totalSlots} slots open
                      </span>
                    )}
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setEditing(b); }}
                  className="rounded-[var(--radius)] p-2 text-muted transition hover:bg-surface hover:text-text"
                  aria-label="Edit building"
                >
                  <Pencil size={15} />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); remove(b.id); }}
                  className="rounded-[var(--radius)] p-2 text-muted transition hover:bg-surface hover:text-occupied"
                  aria-label="Delete building"
                >
                  <Trash2 size={16} />
                </span>
              </button>
            ),
          )}
        </Card>
      )}

      {selected && <FloorsPanel building={selected} types={types} onError={setError} />}
      {selected && <AllocationPanel buildingId={selected.id} />}
    </div>
  );
}

function AllocationPanel({ buildingId }) {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    managerApi.allocationAnalytics(buildingId).then(setAnalytics).catch(() => setAnalytics(null));
  }, [buildingId]);
  if (!analytics?.floors?.length) return null;
  return (
    <Card className="mt-4 p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Floor utilization</h2>
      <div className="space-y-2">
        {analytics.floors.map((f) => (
          <div key={f.floorId} className="flex items-center gap-3 text-sm">
            <span className="w-28 truncate font-medium">{f.name || `Floor ${f.level}`}</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all"
                style={{ width: `${Math.round(f.fillRate * 100)}%` }}
              />
            </div>
            <span className="nums w-16 text-right text-xs text-muted">
              {f.occupiedSlots}/{f.totalSlots}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EditRow({ building, onSave, onCancel }) {
  const [name, setName] = useState(building.name);
  const [address, setAddress] = useState(building.address ?? "");
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-elevated">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" placeholder="Name" />
      <Input value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1" placeholder="Address" />
      <Button variant="ghost" onClick={() => onSave({ name, address: address || null })} aria-label="Save">
        <Check size={16} />
      </Button>
      <Button variant="ghost" onClick={onCancel} aria-label="Cancel">
        <X size={16} />
      </Button>
    </div>
  );
}

function FloorsPanel({ building, types, onError }) {
  const [floors, setFloors] = useState(null);
  const [openFloor, setOpenFloor] = useState(null);
  const [form, setForm] = useState({ level: "", name: "" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    managerApi.floors(building.id).then(setFloors).catch((e) => onError(e.message));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the building changes
  useEffect(load, [building.id]);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    onError("");
    try {
      await managerApi.createFloor(building.id, { level: Number(form.level), name: form.name });
      setForm({ level: "", name: "" });
      load();
    } catch (err) {
      onError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const setType = async (floorId, vehicleTypeId) => {
    onError("");
    try {
      await managerApi.setFloorVehicleType(floorId, vehicleTypeId ? Number(vehicleTypeId) : null);
      load();
    } catch (err) {
      onError(err.message);
    }
  };

  const remove = async (id) => {
    onError("");
    try {
      await managerApi.deleteFloor(id);
      if (openFloor === id) setOpenFloor(null);
      load();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <h2 className="text-sm font-semibold tracking-tight">Floors · {building.name}</h2>

      <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end">
        <Field label="Level">
          <Input type="number" required value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
        </Field>
        <Field label="Name">
          <Input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ground, B1..." />
        </Field>
        <Button type="submit" variant="secondary" loading={creating}>
          <Plus size={16} /> Add floor
        </Button>
      </form>

      {floors === null ? (
        <div className="mt-4 text-sm text-muted">Loading floors...</div>
      ) : floors.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No floors yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-line border-t border-line">
          {floors.map((f) => (
            <div key={f.id} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setOpenFloor(openFloor === f.id ? null : f.id)} className="flex items-center gap-2 text-left">
                  <ChevronRight size={15} className={`text-muted transition ${openFloor === f.id ? "rotate-90" : ""}`} />
                  <span className="nums text-sm font-medium">L{f.level}</span>
                  <span className="text-sm text-muted">{f.name}</span>
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <Select
                    className="w-32 py-1.5 text-xs sm:w-40"
                    value={f.vehicleTypeId ?? ""}
                    onChange={(e) => setType(f.id, e.target.value)}
                  >
                    <option value="">Any vehicle type</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                  <Button variant="ghost" onClick={() => remove(f.id)} aria-label="Delete floor">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              {openFloor === f.id && <SlotsPanel floor={f} onError={onError} />}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SlotsPanel({ floor, onError }) {
  const [slots, setSlots] = useState(null);
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    managerApi.slots(floor.id).then(setSlots).catch((e) => onError(e.message));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the floor changes
  useEffect(load, [floor.id]);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    onError("");
    try {
      await managerApi.createSlot(floor.id, { code });
      setCode("");
      load();
    } catch (err) {
      onError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (id, status) => {
    onError("");
    try {
      await managerApi.setSlotStatus(id, status);
      load();
    } catch (err) {
      onError(err.message);
    }
  };

  const remove = async (id) => {
    onError("");
    try {
      await managerApi.deleteSlot(id);
      load();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="mt-3 rounded-[var(--radius)] border border-line bg-bg/40 p-4">
      <form onSubmit={create} className="flex items-end gap-2">
        <Field label="Slot code">
          <Input required maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} placeholder="A-01" />
        </Field>
        <Button type="submit" variant="secondary" loading={creating}>
          <Plus size={15} /> Add slot
        </Button>
      </form>

      {slots === null ? (
        <div className="mt-3 text-xs text-muted">Loading slots...</div>
      ) : slots.length === 0 ? (
        <p className="mt-3 text-xs text-muted">No slots on this floor.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {slots.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-line bg-surface px-3 py-2">
              <span className="nums text-sm font-medium">{s.code}</span>
              <StatusBadge status={s.status} />
              <div className="ml-auto flex items-center gap-1">
                <Select className="w-28 py-1 text-xs sm:w-32" value={s.status} onChange={(e) => setStatus(s.id, e.target.value)}>
                  {SLOT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Select>
                <Button variant="ghost" onClick={() => remove(s.id)} aria-label="Delete slot">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
